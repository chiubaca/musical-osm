/**
 * Adapted from code written by James Westman:
 * https://gitlab.com/jwestman/osm-in-realtime/-/blob/master/src/service.jsx
 */

import Pako from 'pako';
export interface ChangeSet {
  id: string;
  numChanges: string;
  user: string;
  userId: string;
  center: number[];
  bbox: number[][];
  comment: string;
}

export interface CallbackFunction { (ChangeSet): void }

const MIRROR = 'https://planet.openstreetmap.org';
const MILLISECS = 60000;
export default class Service {
  private _callbacks: CallbackFunction[];
  private _timeout: undefined | ReturnType<typeof setTimeout>;
  private _sequence: number;
  private _baseTime: number;

  constructor() {
    this._callbacks = [];
    this._timeout = undefined;
  }

  /**
   * Register a callback function which will be executed on every OSM changeset that is detetected
   * Multiple number of callbacks can be registered. They will be executed in the order they are registered
   * @param cb 
   */
  public register(cb: { (changeset): void }) {
    this._callbacks.push(cb);
  }

  public unregister(cb) {
    let index;
    while ((index = this._callbacks.indexOf(cb)) !== -1) {
      this._callbacks.splice(index, 1);
    }
  }

  /**
   * Initialisation method. 
   * Extracts the time and sequence number of the latest OSM changeset from a YAML file. 
   * 
   * @returns void
   */
  public async start() {

    const response = await fetch(`${MIRROR}/replication/changesets/state.yaml`);

    if (!response.ok) {
      // TODO: Error handling
      return;
    }

    const text = await response.text();
    // Extract the sequence number from the YAML
    this._sequence = parseInt(text.match(/sequence: (\d+)/)[1]) + 1;
    // Extract and covert the date from the YAML and convert to a UNIX timestamp
    const dateText = text.match(/last_run: ([\d-]+ [\d:]+)/)[1].replace(' ', 'T');
    this._baseTime = Date.parse(dateText) - MILLISECS;
    this._onTimeout();
  }

  stop() {
    if (this._timeout !== undefined) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }
  }
  /**
   *  Utilises the sequence number to fetch the a payload of current OSM changesets.
   *  Method recursively calls itself whilst indefinitely until unregister() explicity called.
   */
  private async _onTimeout() {
    // Recursively run this self for every 
    this._timeout = setTimeout(this._onTimeout.bind(this), MILLISECS);

    // The OSM sequence can be translated into the corresponding URL path 
    // e.g "/replication/changesets/004/365/130"
    const seq = (`000000000${this._sequence}`) // TODO: this could break in the future...
      .substr(-9)
      .replace(/(\d{3})/g, '$1/')
      .replace(/\/$/, '');

    //fetch the corresponding changeset .gz based on the sequence number 
    const response = await fetch(
      `${MIRROR}/replication/changesets/${seq}.osm.gz`,
    );

    if (!response.ok) {
      // TODO: Error handling
    }
    // Extract the XML from the .gz file
    const xml = Pako.inflate(await response.arrayBuffer(), { to: 'string' });

    // Parse the XML and run any attached callback functions
    this._parseChangesets(xml);


    this._sequence++;
    this._baseTime += MILLISECS;
  }

  /**
   * Parses the OSM changeset and scans the XML for changeset which has a 'closed_at' attribuite. I assume this indicates 
   * That the OSM edit has been commited. 
   * 
   * For each commited change that is identified, a small payload is generated with metadata about the edit which is
   * passed over into a setTimeout with slight delay determined by the current sequence - the of the commited changeset. 
   * 
   * @param xml {string} - xml changeset from OSM
   *                       example payload: https://planet.openstreetmap.org/replication/changesets/004/373/632.osm.gz
   */
  private _parseChangesets(xml: string) {
    // use the DOMParser to read the contents of the XML file
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    // Only interested in the changeset tags
    const changesets = xmlDoc.getElementsByTagName('changeset');
    for (const element of changesets) {

      if (element.hasAttribute('closed_at')) {

        const commentTag = element.querySelector('tag[k="comment"]');
        const comment = commentTag ? commentTag.getAttribute('v') : undefined;
        const minlat = parseFloat(element.getAttribute('min_lat'));
        const minlon = parseFloat(element.getAttribute('min_lon'));
        const maxlat = parseFloat(element.getAttribute('max_lat'));
        const maxlon = parseFloat(element.getAttribute('max_lon'));

        // so empty changesets are apparently a thing we have to handle gracefully
        if (!minlat) continue;

        const changeset: ChangeSet = {
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

        // An offset time is generate based the last generated sequence time - current change commited time.
        // This produced the feel that the data is being streamed in at realtime.
        const time = Date.parse(element.getAttribute('closed_at'));
        const offset = time - this._baseTime;
        setTimeout(this._addChangeset.bind(this, changeset), offset);
      }
    }
  }
  /**
   * Run any callback functions
   * @param changeset {function}
   */
  private _addChangeset(changeset: ChangeSet) {
    for (const callback of this._callbacks) {
      callback(changeset);
    }
  }
}