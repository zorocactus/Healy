#!/usr/bin/env bash
# Healy backend — build/release script (Railway, Render).
# Lancé une fois par déploiement, AVANT que le web démarre.
set -o errexit

echo "──► Installing Python deps (prod, sans IA)"
pip install -r requirements-prod.txt

echo "──► Collecting static files"
python manage.py collectstatic --noinput

echo "──► Running migrations"
python manage.py migrate --noinput

echo "──► Creating cache table (idempotent)"
python manage.py createcachetable || true

echo "──► Build done."
