FROM python:3.9-slim

RUN apt-get update && \
    apt-get install -y \
    git \
    aria2 \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

VOLUME /root/.config/anime-downloader

WORKDIR /video_search

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
RUN python3 -m pip install -U pip setuptools

ENV LOG_LEVEL=info

RUN pip install gunicorn[gevent]

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py wsgi.py ./

CMD gunicorn --worker-class gevent --workers 2 --bind 0.0.0.0:5000 wsgi:app --max-requests 1000 --timeout 5 --keep-alive 5 --log-level $LOG_LEVEL
