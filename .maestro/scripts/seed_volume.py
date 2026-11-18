"""Seeds the app database with production-like volume for QA.

Usage: python3 -I seed_volume.py <mock-data.json> <artemis.db already migrated>

- categories/products/customers come from a (fake) mock-data.json dump
- customers are padded to 5000 with synthetic variations
- 15000 work orders over ~2 years: past ones closed (with report and
  payment), current/future ones pending
- 1 active itinerary (current week) + ~80 finished weekly itineraries
"""
import json
import random
import sqlite3
import sys
import uuid
from datetime import datetime, timedelta, timezone

random.seed(42)
mock_path, db_path = sys.argv[1], sys.argv[2]
mock = json.load(open(mock_path))['tables']
db = sqlite3.connect(db_path)
db.execute('PRAGMA foreign_keys = ON')
cur = db.cursor()

N_CUSTOMERS = 5000
N_WORK_ORDERS = 15000
now = datetime.now(timezone.utc).replace(microsecond=0)


def uid():
    return str(uuid.uuid4())


def iso(d):
    return d.strftime('%Y-%m-%dT%H:%M:%S.000Z')


# ---- categories and products (from the mock)
cats = mock['category']
for c in cats:
    cur.execute(
        'INSERT OR IGNORE INTO category (id, name, is_active) VALUES (?,?,?)',
        (c['id'], c['name'], 1 if c.get('isActive', True) else 0),
    )
prods = mock['product']
for p in prods:
    cur.execute(
        'INSERT OR IGNORE INTO product (id, name, category_id, sale_price, is_active, expiration) VALUES (?,?,?,?,?,?)',
        (p['id'], p['name'], p['categoryId'], float(p['salePrice']),
         1 if p.get('isActive', True) else 0, p.get('expiration') or '6m'),
    )
active_products = [p for p in prods if p.get('isActive', True)]

# ---- customers: mock + synthetic ones up to N_CUSTOMERS
base = mock['customer']
customers = []
suffixes = ['', ' II', ' Filial', ' Express', ' Centro', ' Bairro', ' & Cia']
i = 0
while len(customers) < N_CUSTOMERS:
    src = base[i % len(base)]
    gen = i // len(base)
    cid = src['id'] if gen == 0 else uid()
    store = src['storeName'] + (suffixes[gen % len(suffixes)] if gen else '')
    phone = src.get('phoneNumber')
    if gen and phone:
        phone = phone[:-4] + f'{random.randint(0, 9999):04d}'
    customers.append((
        cid, store, src['contactName'], phone, src.get('phoneIsWhatsApp'),
        src.get('landlineNumber'), src.get('landlineIsWhatsApp'),
        src['addressStreetName'], str(src['addressStreetNumber'] or 'S/N'),
        src['addressNeighborhood'], src['addressCity'], src['addressState'],
        src['addressZipCode'],
    ))
    i += 1
cur.executemany(
    '''INSERT OR IGNORE INTO customer (id, store_name, contact_name, phone_number, phone_is_whatsapp,
       landline_number, landline_is_whatsapp, address_street_name, address_street_number,
       address_neighborhood, address_city, address_state, address_zip_code)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''',
    customers,
)
customer_ids = [c[0] for c in customers]

# ---- OS
week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0)
week_end = week_start + timedelta(days=6, hours=23, minutes=59)
open_this_week = []
wo_rows, item_rows, res_rows, res_item_rows, pay_rows = [], [], [], [], []

for n in range(N_WORK_ORDERS):
    woid = uid()
    cust = random.choice(customer_ids)
    # 90% in the past (up to 2 years), 10% from today to +30 days
    if n < N_WORK_ORDERS * 0.9:
        sched = now - timedelta(days=random.randint(1, 730), hours=random.randint(0, 10))
    else:
        sched = week_start + timedelta(days=random.randint(0, 30), hours=random.randint(8, 18))
    chosen = random.sample(active_products, k=random.randint(1, 4))
    items = [(p, random.randint(1, 6)) for p in chosen]
    for p, q in items:
        item_rows.append((uid(), woid, p['id'], q, float(p['salePrice'])))

    status, result_id, visit, pay_id = 'PENDING', None, None, None
    if sched < now - timedelta(days=1):
        roll = random.random()
        if roll < 0.06:
            status = 'EXPIRED'
        else:
            result_id = uid()
            visit = sched + timedelta(hours=random.randint(0, 5))
            exchanged = [(p, q) for p, q in items if random.random() < 0.85]
            added = [(random.choice(active_products), random.randint(1, 3))] if random.random() < 0.3 else []
            removed = [(p, 1) for p, q in items if random.random() < 0.1]
            if not exchanged and not added:
                status = 'FAILED'
            elif removed or len(exchanged) < len(items):
                status = 'PARTIAL'
            else:
                status = 'COMPLETED'
            total = round(sum(float(p['salePrice']) * q for p, q in exchanged + added), 2)
            res_rows.append((result_id, total))
            for kind, lst in (('EXCHANGED', exchanged), ('ADDED', added), ('REMOVED', removed)):
                for p, q in lst:
                    res_item_rows.append((uid(), result_id, p['id'], q, float(p['salePrice']), kind, None))
            if total > 0:
                pay_id = uid()
                inst = random.choice([1, 1, 1, 2, 3])
                paid = random.random() < 0.8
                pay_rows.append((pay_id, random.choice(['Dinheiro', 'PIX', 'Cartão']), total, inst,
                                 1 if paid else 0, inst if paid else random.randint(0, inst - 1),
                                 iso(visit) if paid else None))
            if status in ('COMPLETED', 'PARTIAL') and random.random() < 0.3:
                status = 'COPIED'
    elif week_start <= sched <= week_end:
        open_this_week.append((woid, sched))
    wo_rows.append((woid, cust, iso(sched - timedelta(days=3)), iso(sched), iso(sched),
                    iso(visit) if visit else None, pay_id, status, result_id,
                    'Ligar antes' if random.random() < 0.1 else None))

cur.executemany('INSERT INTO payment_order (id, method, total_value, installments, is_paid, paid_installments, payment_date) VALUES (?,?,?,?,?,?,?)', pay_rows)
cur.executemany('INSERT INTO work_order_result (id, total_value) VALUES (?,?)', res_rows)
cur.executemany(
    'INSERT INTO work_order (id, customer_id, created_at, updated_at, scheduled_date, visit_date, payment_order_id, status, result_id, notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [(w[0], w[1], w[2], w[2], w[3], w[5], w[6], w[7], w[8], w[9]) for w in wo_rows],
)
cur.executemany('INSERT INTO work_order_item (id, work_order_id, product_id, quantity, price_snapshot) VALUES (?,?,?,?,?)', item_rows)
cur.executemany('INSERT INTO work_order_result_item (id, result_id, product_id, quantity, price_snapshot, type, observation) VALUES (?,?,?,?,?,?,?)', res_item_rows)

# ---- history: 80 finished weekly itineraries with closed work orders
closed = [w for w in wo_rows if w[7] in ('COMPLETED', 'PARTIAL', 'FAILED', 'COPIED', 'EXPIRED')]
closed.sort(key=lambda w: w[3])
for k in range(80):
    start = week_start - timedelta(weeks=k + 1)
    end = start + timedelta(days=6, hours=23, minutes=59)
    itid = uid()
    cur.execute('INSERT INTO itinerary (id, initial_itinerary_date, final_itinerary_date, is_finished) VALUES (?,?,?,1)',
                (itid, iso(start), iso(start + timedelta(days=6))))
    in_week = [w for w in closed if iso(start) <= w[3] <= iso(end)]
    for pos, w in enumerate(in_week, 1):
        cur.execute('INSERT INTO itinerary_work_order (id, itinerary_id, work_order_id, position, is_late) VALUES (?,?,?,?,?)',
                    (uid(), itid, w[0], pos, 1 if w[7] == 'EXPIRED' else 0))

# ---- active itinerary for the current week
itid = uid()
cur.execute('INSERT INTO itinerary (id, initial_itinerary_date, final_itinerary_date, is_finished) VALUES (?,?,?,0)',
            (itid, iso(week_start), iso(week_start + timedelta(days=6))))
open_this_week.sort(key=lambda x: x[1])
for pos, (woid, sched) in enumerate(open_this_week, 1):
    cur.execute('INSERT INTO itinerary_work_order (id, itinerary_id, work_order_id, position, is_late) VALUES (?,?,?,?,?)',
                (uid(), itid, woid, pos, 1 if sched < now else 0))

db.commit()
for t in ['customer', 'product', 'work_order', 'work_order_item', 'work_order_result', 'work_order_result_item', 'payment_order', 'itinerary', 'itinerary_work_order']:
    print(t, cur.execute(f'SELECT count(*) FROM {t}').fetchone()[0])
print('work orders in the active itinerary:', len(open_this_week))
db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
db.close()
