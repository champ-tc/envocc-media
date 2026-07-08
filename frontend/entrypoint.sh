#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:?DB_USER is required}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"

echo "⏳ Waiting for MySQL to be ready at ${DB_HOST}:${DB_PORT}..."

for i in $(seq 1 30); do
  if mysql --protocol=TCP --disable-ssl \
    -h"$DB_HOST" -P"$DB_PORT" \
    -u"$DB_USER" -p"$DB_PASSWORD" \
    -e "SELECT 1" >/dev/null 2>&1; then
    echo "✅ DB is up"
    break
  fi

  echo "⏳ Waiting ($i)... MySQL is not reachable with DB_USER=${DB_USER}. If DB_HOST is an internal agency host, verify that the server is connected to VPN."
  sleep 2
done

if ! mysql --protocol=TCP --disable-ssl \
  -h"$DB_HOST" -P"$DB_PORT" \
  -u"$DB_USER" -p"$DB_PASSWORD" \
  -e "SELECT 1"; then
  echo "❌ Database not ready after timeout. Exiting..."
  echo "   Check DB_HOST=${DB_HOST}, DB_PORT=${DB_PORT}, DB_USER=${DB_USER}, and VPN connectivity to the agency network."
  exit 1
fi

echo "📦 Running Prisma Migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || exit 1

echo "🚀 Starting Next.js..."
npm run start
