synctube.videosearch = class {

  constructor(obj) {
    this.api = obj.api;
    this.apiPolyfill();
    this.api.notifyOnVideoChange(this.proxyCheck.bind(this));
    this.addStyles(`${obj.path}/style.css`);
    this.addOverlay();
    this.addSearchButton();
  }

  addOverlay() {
    const searchoverlay = document.querySelector('.searchol');
    if (searchoverlay) return;
    const overlay = this.nodeFromString(`
      <div id="searchol" class="overlay" style="display: none">
        <span class="closebtn" title="Close Overlay">x</span>
        <div class="overlay-content">
          <form action="">
            <input type="text" placeholder="Search..." name="search">
            <button type="submit"><i class="fa fa-search"></i></button>
          </form>
        </div>
      </div>
    `);
    const infobuttons = document.querySelector("#playlist"
    ).querySelector('.info');
    infobuttons.insertAdjacentElement('afterend', overlay);
    const closebutton = document.querySelector('.closebtn');
    closebutton.onclick = () => {
      document.querySelector("#searchol").style.display = "none";
    }
  }

  addSearchButton() {
    const searchbutton = document.querySelector('#searchbutton');
    if (searchbutton) return;
    const button = this.nodeFromString(`
      <button id="searchbutton" title="Search">
       <ion-icon name="search"></ion-icon>
      </button>
    `);
    button.onclick = () => {
      const searchoverlay = document.querySelector('#searchol');
      searchoverlay.style.display = "block";
    }
    const section = document.querySelector('#playlist');
    const divinfo = section.querySelector('.info');
    const controls = divinfo.querySelector('.controls');
    controls.appendChild(button);
  }


  proxyCheck(player) {
    let api = this.api;
    const url = player.url;
    const proxyUrl = `/proxy_video?url=${encodeURI(url)}`;
    //proxyUrl = `${this.path}/test.mp4`;

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

  addStyles(cssUrl) {
    const link = document.createElement('link');
    link.href = cssUrl;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  nodeFromString(div) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = div;
    return wrapper.firstElementChild;
  }

}
