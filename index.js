const PROXYPATH = "/proxy_video";
const SEARCHPATH = "/search";
const GETEPCOUNTPATH = "/get_epcount";
const GETEPURLPATH = "/get_video";
const AXIOSPATH = "https://unpkg.com/axios/dist/axios.min.js";

synctube.videosearch = class {

  constructor(obj) {
    this.api = obj.api;
    this.path = obj.path;
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
          <input type="text" placeholder="Search..." name="search">
          <button id="submitsrch" type="submit">
            <i class="fa fa-search">Go!</i></button>
        </div>
        <div class="select"></div>
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
      const searchinput = overlay.querySelector("input");
      if (!searchinput) return;
      if (!searchinput.value) return;
      this.doSearch(searchinput.value, this.displaySel.bind(this));
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

  displaySel(results) {
    const seldiv = document.querySelector(".select");
    const srchlist = seldiv.querySelector("ul");
    var sellist;
    if (srchlist) {
      sellist = srchlist.cloneNode(false);
      seldiv.replaceChild(sellist, srchlist);
    } else {
      sellist = document.createElement("ul");
      sellist.style.display = "inline";
      seldiv.append(sellist);
    }
    Object.keys(results).forEach((title) => {
      const item = document.createElement("li");
      item.style.width = "200px";
      item.onclick = () => {
        const queuebtn = item.querySelector(".epqueue");
        if (queuebtn) return;
        this.getEpCount(results[title].url, (eps) => {
          this.displayEps(item, title, results[title].url, eps);
        });
      }
      item.innerHTML = `
        <img src=${results[title].poster} style="width: 100%; height: 100%"><br>
        <h4>${title}</h4><br>
      `;
      sellist.append(item);
    });
  }

  resetSearch() {
    const searchoverlay = document.querySelector(".searchol");
    const seldiv = searchoverlay.querySelector(".select");
    const sellist = seldiv.querySelector("ul");
    if (sellist) sellist.remove();
    const searchinput = searchoverlay.querySelector("input");
    searchinput.value = "";
    this.hideSearch();
  }

  displayEps(item, title, url, count) {
    const epselect = this.nodeFromString(`
      <select name="episodes" multiple></select>
    `);
    const submitbtn = this.nodeFromString(`
      <button class="epqueue" type="submit">Queue Eps</button>
    `);
    if (count > 1) {
      submitbtn.onclick = () => {
        this.resetSearch();
        const checked = epselect.querySelectorAll(":checked");
        const selected = [...checked].map(option => option.value);
        this.getEps(url, selected, (episodes) => {
          selected.forEach((epNo) => {
            this.queueEp(episodes[epNo]);
          });
        });
      };
      for (var i=0; i<count; i++) {
        const option = document.createElement("option");
        option.value = i+1;
        option.innerHTML = i+1;
        epselect.append(option);
      }
      item.append(epselect);
    } else {
      submitbtn.onclick = () => {
        this.resetSearch();
        this.getEps(url, [1], (episodes) => {
          this.queueEp(episodes[1]);
        });
      };
    }
    item.append(submitbtn);
  }

  queueEp(episode) {
    this.api.addVideoItem(episode.video, true, true);
  }

  doSearch(title, callback) {
    axios.get(SEARCHPATH, {params: {
      title: title
    }})
    .then(function (response) {
      typeof callback === 'function' && callback(response.data);
      return response.data;
    });
  }

  getEps(url, episodes, callback) {
    var params = {url: url};
    if (Array.isArray(episodes)) {
      params["ep"] = episodes.join();
    }
    axios.get(GETEPURLPATH, {params: params})
    .then(function (response) {
      typeof callback === 'function' && callback(response.data);
      return response.data;
    });
  }

  getEpCount(url, callback) {
    axios.get(GETEPCOUNTPATH, {params: {
      url: url
    }})
    .then(function (response) {
      typeof callback === 'function' && callback(response.data.episodes);
      return response.data.episodes;
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
