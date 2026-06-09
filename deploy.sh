#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env so migrations run against the right database
[ -f .env ] && set -a && source .env && set +a

echo "→ Pulling latest..."
git pull

echo "→ Installing deps..."
npm ci

echo "→ Generating Prisma client..."
npx prisma generate

echo "→ Running migrations..."
npx prisma migrate deploy

echo "→ Seeding database..."
npx tsx prisma/seed.ts

echo "→ Building..."
npm run build

echo "→ Restarting service..."
sudo systemctl restart ashhq

echo "✅ Deploy complete"
