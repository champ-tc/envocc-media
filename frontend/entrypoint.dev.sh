#!/bin/sh

echo "⏳ Waiting for MySQL to be ready..."
for i in $(seq 1 30); do
  if mysqladmin ping -h "db" -u root -p"$DB_ROOT_PASSWORD" --silent; then
    echo "✅ DB is up"
    break
  fi
  echo "⏳ Waiting ($i)..."
  sleep 2
done

if ! mysqladmin ping -h "db" -u root -p"$DB_ROOT_PASSWORD" --silent; then
  echo "❌ Database not ready after timeout. Exiting..."
  exit 1
fi

echo "📦 Running Prisma Migrations (dev)..."
npx prisma migrate dev --name init --skip-generate || echo "⚠️ Migration might already be applied."

echo "🚀 Starting Next.js Dev Server..."
npm run dev
