import time
import ast
import logging
import requests
from urllib.parse import urlparse, parse_qsl
from cachetools import TTLCache
from anime_downloader.config import Config
from anime_downloader.sites import get_anime_class
from anime_downloader.util import parse_ep_str, print_episodeurl

from flask import Flask, request
app = Flask(__name__)

app.config['JSON_SORT_KEYS'] = False

ANIME_SITE = get_anime_class(Config.CONTEXT_SETTINGS['default_map']['dl']['provider'])
ALLOWED_URLS = TTLCache(maxsize=256, ttl=24*60*60)

@app.route('/auth', methods=['GET'])
def authenticate():
    # Checks if URL is in list of recently fetched URLs
    proxy_url = request.headers['X-Original-URI']
    query = dict(parse_qsl(urlparse(proxy_url).query))
    dest_url = query['url']
    if dest_url in ALLOWED_URLS.keys():
        return 'Access to this resource is allowed.', 200
    return 'Access to this resource is not allowed.', 403

@app.route('/search', methods=['GET'])
def search():
    # Searches a handler for the title requested
    # and returns JSON list of options
    # For now only anime-downloader is supported
    handler = request.args.get('type')
    if not handler:
        handler = 'anime-dl'
    title = request.args['title']

    if handler == 'anime-dl':
        search = ANIME_SITE.search(title)
        search_data = {}
        for entry in search:
            search_data[entry.title] = {
                'url': entry.url,
                'poster': entry.poster,
            }
        return search_data

    else:
        return 'Not a valid handler type.', 400

@app.route('/get_video', methods=['GET'])
def get_video():
    # Retrieves video URL from page URL
    # For now only anime-downloader is supported
    handler = request.args.get('type')
    if not handler:
        handler = 'anime-dl'
    page_url = request.args['url']
    video_list = {}

    if handler == 'anime-dl':
        episodes = request.args.get('ep')
        anime = ANIME_SITE(page_url)
        if episodes:
            try:
                episode_list = parse_ep_str(anime, episodes)
            except ValueError:
                return 'Not a valid value for arg "episodes".', 400
        else:
            episode_list = parse_ep_str(anime, f'1:{len(anime)}')

        for episode in episode_list:
            video_url = episode.source().stream_url
            ts = int(time.time())
            # Check for redirects and use these instead
            user_agent = ast.literal_eval(episode.agent)['user-agent']
            headers = {'User-Agent': user_agent}
            cookies = episode.cookies
            r = requests.head(video_url, headers=headers, cookies=cookies,
                allow_redirects=True)
            video_url = r.url
            video_list[f'{anime.title} - Ep {episode.ep_no}'] = {
                'title': anime.title,
                'video': video_url,
                'episode': episode.ep_no,
                'timestamp': ts,
            }
            # Add video to allow list so it can be proxied later
            ALLOWED_URLS[video_url] = ts

    else:
        return 'Not a valid handler type.', 400

    return video_list


if __name__ == '__main__':
    # run app in debug mode on port 5000
    app.run(debug=True, port=5000)

else:
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)
