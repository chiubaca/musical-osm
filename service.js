/**
 * Full credits to James Westman 
 * https://gitlab.com/jwestman/osm-in-realtime/-/blob/master/src/service.jsx
 */

import Pako from 'pako';

const MIRROR = "https://planet.openstreetmap.org";
const MINUTE = 60000;


export default class Service {
  constructor() {
    this._callbacks = [];
    this._timeout = undefined;
  }

  register(cb) {
    this._callbacks.push(cb);
  }

  unregister(cb) {
    let index;
    while ((index = this._callbacks.indexOf(cb)) !== -1) {
      this._callbacks.splice(index, 1);
    }
  }

  async start() {
    let response = await fetch(MIRROR + "/replication/changesets/state.yaml");

    if (!response.ok) {
      // TODO: Error handling
      return;
    }

    let text = await response.text();
    this._sequence = parseInt(text.match(/sequence: (\d+)/)[1]) + 1;
    let dateText = text.match(/last_run: ([\d-]+ [\d:]+)/)[1].replace(" ", "T");
    this._baseTime = Date.parse(dateText) - MINUTE;
    this._onTimeout();
  }

  stop() {
    if (this._timeout !== undefined) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }
  }

  async _onTimeout() {
    this._timeout = setTimeout(this._onTimeout.bind(this), MINUTE);

    let seq = ("000000000" + this._sequence).substr(-9).replace(/(\d{3})/g, "$1/").replace(/\/$/, "");
    let response = await fetch(MIRROR + "/replication/changesets/" + seq + ".osm.gz");

    if (!response.ok) {
      // TODO: Error handling
    }

    let xml = Pako.inflate(await response.arrayBuffer(), {to: "string" });

    this._parseChangesets(xml);

    this._sequence ++;
    this._baseTime += MINUTE;
  }

  _parseChangesets(xml) {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xml, "text/xml");
    let changesets = xmlDoc.getElementsByTagName("changeset");

    for (let element of changesets) {
      if (element.hasAttribute("closed_at")) {
        let time = Date.parse(element.getAttribute("closed_at").replace(/Z$/, ""));
        let offset = time - this._baseTime;

        let commentTag = element.querySelector('tag[k="comment"]');
        let comment = commentTag ? commentTag.getAttribute("v") : undefined;

        let minlat = parseFloat(element.getAttribute("min_lat"));
        let minlon = parseFloat(element.getAttribute("min_lon"));
        let maxlat = parseFloat(element.getAttribute("max_lat"));
        let maxlon = parseFloat(element.getAttribute("max_lon"));

        if (!minlat) {
          // so empty changesets are apparently a thing we have to handle
          // gracefully
          continue;
        }

        let changeset = {
          id: element.getAttribute("id"),
          numChanges: element.getAttribute("num_changes"),
          user: element.getAttribute("user"),
          userId: element.getAttribute("uid"),
          center: [(minlat + maxlat) / 2, (minlon + maxlon) / 2],
          bbox: [[minlat, minlon], [maxlat, maxlon]],
          comment
        }

        setTimeout(this._addChangeset.bind(this, changeset), offset);
      }
    }
  }

  _addChangeset(changeset) {
    changeset.timeShown = new Date().getTime();

    for (let cb of this._callbacks) {
      cb(changeset);
    }
  }
}
