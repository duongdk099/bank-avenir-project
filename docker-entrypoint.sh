#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "✅ Migrations completed!"
echo "🚀 Starting NestJS application..."

exec node dist/src/main.js
