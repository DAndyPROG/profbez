release: python manage.py wait_for_db && python manage.py collectstatic --noinput && python manage.py migrate --noinput
web: gunicorn core.wsgi:application -c gunicorn.conf.py