import os

from settings import settings

if settings.LOG_TO_FILE:
    log_filename = 'gunicorn.log'
    accesslog = log_filename
    errorlog = log_filename

    if not os.path.exists(log_filename):
        with open(log_filename, 'w'):
            pass

bind = f'{settings.HOST}:{settings.FRONTEND_PORT}'
loglevel = settings.LOGLEVEL
reload = settings.DEBUG
workers = 2
worker_class = 'gevent'
worker_connections = 100
max_requests = 1000
max_requests_jitter = 50
capture_output = True
