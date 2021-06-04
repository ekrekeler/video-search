synctube.videosearch = class {

  constructor(obj) {
    this.api = obj.api;
    this.apiPolyfill();
    this.api.notifyOnVideoChange(this.proxyCheck.bind(this));
  }

  proxyCheck(player) {
    let api = this.api;
    const url = player.url;
    const proxyUrl = `/proxy_video?url=${encodeURI(url)}`;
    // proxyUrl = `${this.path}/test.mp4`;

    // If we are already proxying then this will not help
    if (url.includes("/proxy_video?url=")) return;

    const localIp = api.getLocalIp();
    const globalIp = api.getGlobalIp();
    // If the video fails when using same IP, then proxy will not help
    if (url.indexOf(globalIp) != -1) return;

    this.fetchStatus(proxyUrl, status => {
      // If proxy cannot fetch the video, then no point in changing the URL
      if (status != 200) return;
    });

    // Add a listener for the video
    var video = document.getElementById("videoplayer");
    video.addEventListener("error", function(e) {
      // Useful for debugging
      //console.log("Error " + e.target.error.code + "; details: " + e.target.error.message);
      const currentTime = api.getTime();
      api.setVideoSrc(proxyUrl);
      api.setTime(currentTime);
    });

  }

  fetchStatus(address, callback) {
    const client = new XMLHttpRequest();
    client.onload = function () {
      callback(this.status);
    }
    client.open('HEAD', address, true);
    client.send();
  }

  apiPolyfill() {
    let api = this.api;
    let host = location.hostname;
    if (host === '') host = 'localhost';
    if (!api.getLocalIp) api.getLocalIp = () => host;
    if (!api.getGlobalIp) api.getGlobalIp = () => host;
  }

}
