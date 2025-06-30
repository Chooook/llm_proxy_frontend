from flask import Flask, render_template

from settings import settings

BACKEND_URL = f'http://{settings.HOST}:{settings.BACKEND_PORT}'

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html', backend_url=BACKEND_URL)
