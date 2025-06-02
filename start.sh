#!/bin/bash

echo "🚀 Starting Railway deployment..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
python manage.py wait_for_db

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🗄️ Running migrations..."
python manage.py migrate --noinput

# Start the application
echo "🎉 Starting gunicorn..."
exec gunicorn core.wsgi:application -c gunicorn.conf.py 