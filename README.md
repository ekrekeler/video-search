# video-search

Video search plugin for [SyncTube](https://github.com/RblSb/SyncTube)

## Installation

- Install and open SyncTube project folder
- Create `user/res/js/custom.js` file:
```js
'use strict';
const JsApi = client.JsApi;
JsApi.addPlugin('video-search');
```
- Create `user/res/plugins/` folder
- Open `plugins` folder in terminal: `cd user/res/plugins`
- `git clone https://github.com/ekrekeler/video-search.git video-search`
- Build the docker images:
```
cd video-search
cd video_search && docker build -t video-search . && cd ..
cd proxy && docker build -t video-proxy
cd ../..
```
- Start the containers:
```
docker run -d --name="video-search" video-search
docker run -d --name="video-proxy" -v video-cache:/proxy-cache -p 8080:8080 \
    -e "CACHE_SIZE=16g" -e "CACHE_AGE=1d" -e "SLICE_SIZE=1m" \
    -e "AUTH_HOST=video-search" -e "AUTH_PORT=5000"
```

Now there should be a button in synctube that can search for (anime) videos and queue them into the player.

## Notes
- While the nginx proxy isn't required, it comes in handy when video links are IP-restricted. It also has a caching feature to save on bandwidth when multiple users are requesting the same video through it. It is configured to check against the video-proxy container to ensure only previously retrieved URLs can be proxied through it.
- Ideally the SyncTube server should have a decent network uplink speed to support the number of streams you plan to proxy. Usually, running this on a dedicated VPS to proxy 1080p video to multiple viewers isn't an issue.
- Currently I am using [traefik](https://doc.traefik.io/traefik/) to proxy reqests to the Synctube server and the nginx server with the same domain name based on URL rules. The nginx server can be configured to do the same thing with a custom configuration file. See "Complex configuration" in the [documentation for the nginx image](https://hub.docker.com/_/nginx).

## Issues and Contributing

I have barely any experience with JavaScript. This plugin is basically a Frankenstein made of pieces from the [octosubs](https://github.com/RblSb/SyncTube-octosubs) and [QSwitcher](https://github.com/aNNiMON/SyncTube-QSwitcher) plugins. Thus, I do not plan on actively maintaining this. If you have an issue or an improvement to suggest, please create a pull request for it and I will see if I can merge it in.

Currently only searches anime sites using [Anime Downloader](https://github.com/anime-dl/anime-downloader). Really this wouldn't be possible without such an existing library that can scrape for video links. If you would the search to support other non-anime sites, you are welcome to fork this project and add your own integrations.

## TODO:

 - Javascript to make the search work
 - Provide a docker compose file example
