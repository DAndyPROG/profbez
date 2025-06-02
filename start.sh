#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Railway deployment..."

# Check if we're in Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "📍 Running in Railway environment"
    echo "🔗 DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"
    echo "🔌 PORT is set to: ${PORT:-8000}"
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

# Start the application
echo "🎉 Starting gunicorn on 0.0.0.0:${PORT:-8000}..."

exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 30 --log-level info 