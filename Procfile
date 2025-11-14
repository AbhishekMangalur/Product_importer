web: gunicorn product_importer.wsgi:application
worker: celery -A product_importer worker --loglevel=info