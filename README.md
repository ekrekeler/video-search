## SyncTube-proxyfallback

Raw video proxy fallback plugin for [SyncTube](https://github.com/RblSb/SyncTube)

### Installation
- Install and open SyncTube project folder
- Create `user/res/js/custom.js` file:
```js
'use strict';
const JsApi = client.JsApi;
JsApi.addPlugin('proxyfallback');
```
- Create `user/res/plugins/` folder
- Open `plugins` folder in terminal: `cd user/res/plugins`
- `git clone https://github.com/ekrekeler/proxyfallback.git proxyfallback`

Now if the mp4 video file fails to load on a non-local browser, the player will attempt to load the video through the SyncTube server. This is helpful for when sites restrict accessing the video file by IP address.

**Note**: This will not work for YouTube or iframes, only raw video links.

**Note**: Ideally the SyncTube server should have high enough network throughput to support the number of streams you plan to proxy. Usually, running this on a dedicated VPS to proxy 1080p video to multiple viewers isn't an issue.

### Issues and Contributing
I have barely any experience with JavaScript. This plugin is basically a Frankenstein made of pieces from the [octosubs](https://github.com/RblSb/SyncTube-octosubs) and [QSwitcher](https://github.com/aNNiMON/SyncTube-QSwitcher) plugins. Thus, I do not plan on actively maintaining this. If you have an issue or an improvement to suggest, please create a pull request for it and I will see if I can merge it in. 
