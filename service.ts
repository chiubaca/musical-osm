/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-cond-assign */
/* eslint-disable radix */
/* eslint-disable no-plusplus */

/**
 * Full credits to James Westman
 * https://gitlab.com/jwestman/osm-in-realtime/-/blob/master/src/service.jsx
 */

import Pako from 'pako';

const MIRROR = 'https://planet.openstreetmap.org';
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
    const response = await fetch(`${MIRROR}/replication/changesets/state.yaml`);

    if (!response.ok) {
      // TODO: Error handling
      return;
    }

    const text = await response.text();
    this._sequence = parseInt(text.match(/sequence: (\d+)/)[1]) + 1;
    const dateText = text.match(/last_run: ([\d-]+ [\d:]+)/)[1].replace(' ', 'T');
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

    const seq = (`000000000${this._sequence}`)
      .substr(-9)
      .replace(/(\d{3})/g, '$1/')
      .replace(/\/$/, '');
    const response = await fetch(
      `${MIRROR}/replication/changesets/${seq}.osm.gz`,
    );

    if (!response.ok) {
      // TODO: Error handling
    }

    const xml = Pako.inflate(await response.arrayBuffer(), { to: 'string' });

    this._parseChangesets(xml);

    this._sequence++;
    this._baseTime += MINUTE;
  }

  _parseChangesets(xml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const changesets = xmlDoc.getElementsByTagName('changeset');

    for (const element of changesets) {
      if (element.hasAttribute('closed_at')) {
        const time = Date.parse(
          element.getAttribute('closed_at').replace(/Z$/, ''),
        );
        const offset = time - this._baseTime;

        const commentTag = element.querySelector('tag[k="comment"]');
        const comment = commentTag ? commentTag.getAttribute('v') : undefined;

        const minlat = parseFloat(element.getAttribute('min_lat'));
        const minlon = parseFloat(element.getAttribute('min_lon'));
        const maxlat = parseFloat(element.getAttribute('max_lat'));
        const maxlon = parseFloat(element.getAttribute('max_lon'));

        if (!minlat) {
          // so empty changesets are apparently a thing we have to handle
          // gracefully
          continue;
        }

        const changeset = {
          id: element.getAttribute('id'),
          numChanges: element.getAttribute('num_changes'),
          user: element.getAttribute('user'),
          userId: element.getAttribute('uid'),
          center: [(minlat + maxlat) / 2, (minlon + maxlon) / 2],
          bbox: [
            [minlat, minlon],
            [maxlat, maxlon],
          ],
          comment,
        };

        setTimeout(this._addChangeset.bind(this, changeset), offset);
      }
    }
  }

  _addChangeset(changeset) {
    changeset.timeShown = new Date().getTime();

    for (const cb of this._callbacks) {
      cb(changeset);
    }
  }
}
