#!/bin/zsh
# Seeds the debug build on the connected Android emulator/device with
# production-like volume (5k customers, 15k work orders) for the Maestro flows.
#
# Usage: .maestro/scripts/seed-device.sh <path/to/mock-data.json>
#
# Requirements:
#   - debug build installed (br.com.artemis) and opened once, so migrations ran
#   - sqlite3 and python3 on the host
# The license row is set to a far-future admin license so QA isn't blocked.
# This only touches the app sandbox of a debuggable build (run-as).
set -euo pipefail

MOCK=${1:?usage: seed-device.sh <mock-data.json>}
PKG=br.com.artemis
DIR=files/SQLite
WORK=$(mktemp -d)
HERE=${0:A:h}

pull() {
  adb exec-out "run-as $PKG sh -c 'dd if=$DIR/$1 2>/dev/null'" | dd of="$WORK/$1" status=none
}

adb shell am force-stop $PKG
for f in artemis.db artemis.db-wal artemis.db-shm; do pull $f; done

sqlite3 "$WORK/artemis.db" 'select count(*) from __drizzle_migrations' >/dev/null \
  || { echo 'Open the app once before seeding (migrations not applied).'; exit 1; }

python3 -I "$HERE/seed_volume.py" "$MOCK" "$WORK/artemis.db"
sqlite3 "$WORK/artemis.db" \
  "update license set expiration_date='2150-01-01', is_admin=1; pragma wal_checkpoint(TRUNCATE);"

adb push "$WORK/artemis.db" /data/local/tmp/artemis.db >/dev/null
adb shell chmod 644 /data/local/tmp/artemis.db
adb shell "run-as $PKG sh -c 'rm -f $DIR/artemis.db-wal $DIR/artemis.db-shm; cp /data/local/tmp/artemis.db $DIR/artemis.db'"
adb shell rm /data/local/tmp/artemis.db
rm -rf "$WORK"
echo 'Seeded.'
