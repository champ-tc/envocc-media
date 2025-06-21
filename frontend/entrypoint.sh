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



echo "📦 Running Prisma Migrations..."
npx prisma migrate deploy || exit 1

echo "🚀 Starting Next.js..."
npm run start
