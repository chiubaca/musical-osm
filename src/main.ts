import L from 'leaflet';
import Service, { ChangeSet } from './service';
import 'leaflet/dist/leaflet.css';
import './style.scss';
import { ChangeSetResp, Changeset } from './common/types';

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

const ONE_MIN = 60000;

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
 * Adds details of the OSM chageset to the info feed
 */
const addToInfoFeed = (changsetDetails) => {
  const { user, comment, numChanges } = changsetDetails;
  document.querySelector('#info-feed').innerHTML = `
  <span class='change-info'> ${user} - ${comment} (${numChanges} changes) </span>
`;
};

/**
 * Callback function which runs on every OSM changeset that is added.
 */
const newChangeSetCallBack = (changeset: Changeset) => {
  const {
    user, min_lat, max_lon, num_changes
  } = changeset;

  const icon = L.divIcon({
    className: 'ripple',
    html: '<div><div class="ring"></div><div class="ring"></div><div class="point"></div></div>',
  });

  const marker = L.marker([min_lat, max_lon], { icon })
    .bindPopup(`${user} - (${num_changes} changes)`)
    .addEventListener('mouseover', () => marker.togglePopup())
    .addEventListener('mouseout', () => marker.togglePopup())
    .addTo(map);
  // addToInfoFeed(changeset);
  playRandomNote();
};

/**
 * Main app logic
 */
const main = async () => {
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


    const resp = await fetch("/latest-osm-changeset");
    const data: ChangeSetResp = await resp.json();
    console.log("🚀 intial data", data)

    const baseTime = new Date(data.changesets[0].created_at).getTime()


    for (const c of data.changesets) {

      const offset = (new Date(c.created_at).getTime() - baseTime) / 250
      console.log("🚀 settings intervals to play at mins: ", (offset / 1000) / 60)




      setTimeout(() => {

        newChangeSetCallBack(c)

      }, offset);
    }



    setTimeout(async () => {

      console.log('fetching next changeset..')

      const resp = await fetch("/latest-osm-changeset");
      const data: ChangeSetResp = await resp.json();
      console.log("🚀 ~ setTimeout ~ data:", data)

      for (const c of data.changesets) {

        const offset = new Date(c.created_at).getTime() - baseTime;
        console.log("🚀 settings intervals to play at mins: ", (offset / 1000) / 60)




        setTimeout(() => {

          newChangeSetCallBack(c)

        }, offset);
      }

    }, ONE_MIN);



  } else {
    console.error('DOM not ready');
  }
};

main();
