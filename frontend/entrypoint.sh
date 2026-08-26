#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"

echo "⏳ Waiting for MySQL to be ready at ${DB_HOST}:${DB_PORT}..."

database_is_reachable() {
  node -e '
    const net = require("node:net");
    const socket = net.createConnection({ host: process.argv[1], port: Number(process.argv[2]) });
    const fail = () => { socket.destroy(); process.exit(1); };
    socket.setTimeout(2000);
    socket.once("connect", () => { socket.destroy(); process.exit(0); });
    socket.once("timeout", fail);
    socket.once("error", fail);
  ' "$DB_HOST" "$DB_PORT"
}

database_ready=false
for i in $(seq 1 30); do
  if database_is_reachable; then
    echo "✅ DB is up"
    database_ready=true
    break
  fi

  echo "⏳ Waiting ($i)... MySQL is not reachable."
  sleep 2
done

if [ "$database_ready" != "true" ]; then
  echo "❌ Database not ready after timeout. Exiting..."
  echo "   Check DB_HOST=${DB_HOST}, DB_PORT=${DB_PORT}, and network connectivity."
  exit 1
fi

echo "📦 Running Prisma Migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || exit 1

echo "🚀 Starting Next.js..."
npm run start
