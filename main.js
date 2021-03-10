import L from 'leaflet';
import Service from './service';
import 'leaflet/dist/leaflet.css';
import './style.css';

/**
 * Nice sounding chords taken from https://codepen.io/teropa/pen/mBbPEe
 */
const SCALES = [
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-G2.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-A2.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-C3.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-D3.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-E3.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-E4.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-G3.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-A3.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-C4.mp3'),
  new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/scale-D4.mp3'),
];

/**
 * Leaflet map
 */
let map;

/**
 * Plays a a random chord
 */
const playRandomNote = () => {
  SCALES[Math.floor(Math.random() * SCALES.length)].play();
};

/**
 * Callback function for OSM service. Runs whenever a new changeset is added
 */
const newChangeSetCallBack = (changeset) => {
  const {
    numChanges, user, center, comment,
  } = changeset;

  const icon = L.divIcon({
    className: 'ripple',
    html: '<div><div class="ring"></div><div class="ring"></div><div class="point"></div></div>',
  });

  const marker = L.marker(center, { icon })
    .bindPopup(`${user} - ${comment} (${numChanges} changes)`)
    .addEventListener('mouseover', () => marker.togglePopup())
    .addEventListener('mouseout', () => marker.togglePopup())
    .addTo(map);

  playRandomNote();
};

/**
 * Main app logic
 */
const main = () => {
  if (document.readyState !== 'loading') {
    map = L.map('mapid', { zoomControl: false }).setView([30.0, 0.0], 2);
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '<a href="https://twitter.com/chiubaca">@chiubaca</a> | &copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      },
    ).addTo(map);

    // Create a the OSM service which polls OSM for new changesets
    const service = new Service();
    // Register a callback function which will be executed every time a new OSM edit is detected.
    service.register(newChangeSetCallBack);
    // Initialises the polling service.
    service.start();
  } else {
    console.error('DOM not ready');
  }
};

main();
