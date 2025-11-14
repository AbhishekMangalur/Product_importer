web: gunicorn product_importer.wsgi --bind 0.0.0.0:$PORT
worker: celery -A product_importer worker --loglevel=INFO --concurrency=1 --max-tasks-per-child=5 --pool solo