import { initDrizzleClient } from '@/src/infra/db/drizzle/drizzle-client'
import { openDatabaseSync } from 'expo-sqlite'

export async function initDatabase() {
  const expoDb = openDatabaseSync('artemis.db')

  // Criar tabela category
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `)

  // Criar tabela customer
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS customer (
      id TEXT PRIMARY KEY NOT NULL,
      store_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      phone_is_whatsapp INTEGER NOT NULL DEFAULT 0,
      landline_number TEXT,
      landline_is_whatsapp INTEGER,
      address_street_name TEXT NOT NULL,
      address_street_number INTEGER NOT NULL,
      address_neighborhood TEXT NOT NULL,
      address_city TEXT NOT NULL,
      address_zip_code TEXT NOT NULL,
      address_latitude REAL NOT NULL,
      address_longitude REAL NOT NULL
    );
  `)

  // Criar tabela product
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS product (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      sale_price REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      expiration TEXT NOT NULL
    );
  `)

  // Criar tabela payment_order
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS payment_order (
      id TEXT PRIMARY KEY NOT NULL,
      method TEXT NOT NULL,
      total_value REAL NOT NULL,
      installments INTEGER NOT NULL DEFAULT 1,
      is_paid INTEGER NOT NULL DEFAULT 0,
      paid_installments INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Criar tabela work_order_result
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS work_order_result (
      id TEXT PRIMARY KEY NOT NULL,
      total_value REAL NOT NULL
    );
  `)

  // Criar tabela work_order
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS work_order (
      id TEXT PRIMARY KEY NOT NULL,
      customer_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      visit_date TEXT,
      payment_order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      result_id TEXT,
      notes TEXT
    );
  `)

  // Criar tabela itinerary
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS itinerary (
      id TEXT PRIMARY KEY NOT NULL,
      initial_itinerary_date TEXT NOT NULL,
      final_itinerary_date TEXT NOT NULL,
      is_finished INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Criar tabela work_order_items
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS work_order_items (
      id TEXT PRIMARY KEY NOT NULL,
      work_order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_snapshot REAL NOT NULL,
      FOREIGN KEY (work_order_id) REFERENCES work_order(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES product(id)
    );
  `)

  // Criar tabela work_order_result_items
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS work_order_result_items (
      id TEXT PRIMARY KEY NOT NULL,
      result_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_snapshot REAL NOT NULL,
      type TEXT NOT NULL,
      observation TEXT,
      FOREIGN KEY (result_id) REFERENCES work_order_result(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES product(id)
    );
  `)

  // Criar tabela itinerary_work_orders
  await expoDb.execAsync(`
    CREATE TABLE IF NOT EXISTS itinerary_work_orders (
      id TEXT PRIMARY KEY NOT NULL,
      itinerary_id TEXT NOT NULL,
      work_order_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_late INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (itinerary_id) REFERENCES itinerary(id) ON DELETE CASCADE,
      FOREIGN KEY (work_order_id) REFERENCES work_order(id)
    );
  `)

  // Criar índices para melhorar performance das queries
  await expoDb.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
    CREATE INDEX IF NOT EXISTS idx_work_order_customer ON work_order(customer_id);
    CREATE INDEX IF NOT EXISTS idx_work_order_payment ON work_order(payment_order_id);
    CREATE INDEX IF NOT EXISTS idx_work_order_result ON work_order(result_id);
    CREATE INDEX IF NOT EXISTS idx_work_order_status ON work_order(status);
    CREATE INDEX IF NOT EXISTS idx_work_order_scheduled ON work_order(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_work_order_items_wo ON work_order_items(work_order_id);
    CREATE INDEX IF NOT EXISTS idx_work_order_result_items_result ON work_order_result_items(result_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_finished ON itinerary(is_finished);
    CREATE INDEX IF NOT EXISTS idx_itinerary_work_orders_itinerary ON itinerary_work_orders(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_work_orders_wo ON itinerary_work_orders(work_order_id);
  `)

  console.log('✅ Database initialized successfully')

  // Inicializar o cliente Drizzle após criar as tabelas
  initDrizzleClient()
}
