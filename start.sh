#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Railway deployment..."

# Check if we're in Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "📍 Running in Railway environment"
    echo "🔗 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"
    echo "🔌 PORT is set to: ${PORT:-8000}"
    echo "🏠 Current directory: $(pwd)"
    echo "📂 Directory contents: $(ls -la)"
fi

# Wait for database to be ready
echo "⏳ Waiting for database..."
python manage.py wait_for_db

echo "✅ Database is ready!"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Static files collected!"

# Run migrations
echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Migrations completed!"

# Check Django configuration
echo "🔧 Checking Django configuration..."
python manage.py check

echo "✅ Django check passed!"

# Test health endpoint before starting gunicorn
echo "🔍 Testing Django setup..."
python manage.py shell -c "
import django
from django.test.utils import get_runner
from django.conf import settings
print('Django version:', django.get_version())
print('DEBUG:', settings.DEBUG)
print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS)
print('DATABASES:', settings.DATABASES['default']['ENGINE'])
"

# Start the application
echo "🎉 Starting gunicorn on 0.0.0.0:${PORT:-8000}..."
echo "🔧 Gunicorn config: $(cat gunicorn.conf.py | grep bind)"

# Add more verbose logging for gunicorn
export DJANGO_LOG_LEVEL=DEBUG

exec gunicorn core.wsgi:application -c gunicorn.conf.py --log-level debug --access-logfile - --error-logfile - 