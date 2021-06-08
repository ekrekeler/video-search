const PROXYPATH = "/proxy_video";
const SEARCHPATH = "/search";
const GETEPPATH = "/get_video";
const AXIOSPATH = "https://unpkg.com/axios/dist/axios.min.js"

synctube.videosearch = class {

  constructor(obj) {
    this.api = obj.api;
    this.path = obj.path
    this.apiPolyfill();
    this.api.notifyOnVideoChange(this.proxyCheck.bind(this));
    this.api.addScriptToHead(AXIOSPATH, () => this.init());
  }

  init() {
    this.addStyles(`${this.path}/style.css`);
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
          <input id="searchinp" type="text" placeholder="Search..." name="search">
          <button id="submitsrch" type="submit">
            <i class="fa fa-search">Go!</i></button>
        </div>
      </div>
    `);
    const infobuttons = document.querySelector("#playlist"
    ).querySelector('.info');
    infobuttons.insertAdjacentElement('afterend', overlay);
    const closebutton = document.querySelector('.closebtn');
    closebutton.onclick = () => {
      this.hideSearch();
    }
    const submitbutton = document.querySelector("#submitsrch");
    submitbutton.onclick = () => {
      this.doSearch();
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
      this.showSearch();
    }
    const section = document.querySelector('#playlist');
    const divinfo = section.querySelector('.info');
    const controls = divinfo.querySelector('.controls');
    controls.appendChild(button);
  }

  showSearch() {
    const searchoverlay = document.querySelector('#searchol');
    searchoverlay.style.display = "block";
  }

  hideSearch() {
    const searchoverlay = document.querySelector("#searchol");
    searchoverlay.style.display = "none";
  }

  doSearch() {
    const searchinput = document.querySelector("#searchinp");
    if (!searchinput) return;
    if (!searchinput.value) return;
    axios.get(SEARCHPATH, {params: {
      title: searchinput.value
    }})
    .then(function (response) {
      console.log(response.data)
      //TODO display these results
    });
  }


  proxyCheck(player) {
    let api = this.api;
    const url = player.url;
    const proxyUrl = `${PROXYPATH}?url=${encodeURI(url)}`;
    //proxyUrl = `${this.path}/test.mp4`;

    // If we are already proxying then this will not help
    if (url.includes(`${PROXYPATH}?`)) return;

    const localIp = api.getLocalIp();
    const globalIp = api.getGlobalIp();
    // If the video fails when using same IP, then proxy will not help
    if (url.indexOf(globalIp) != -1) return;

    // If proxy cannot fetch the video, then no point in changing the URL
    this.fetchStatus(proxyUrl, status => {
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

  fetchStatus(url, callback) {
    // XMLHttpRequest is required for use where axios isn't loaded yet
    const client = new XMLHttpRequest();
    client.onload = function () {
      callback(this.status);
    }
    client.open('HEAD', url, true);
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
