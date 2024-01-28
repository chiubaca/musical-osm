import L from 'leaflet';
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
const addToInfoFeed = (changsetDetails: Changeset) => {
  const { user, num_changes, closed_at } = changsetDetails;
  document.querySelector('#info-feed').innerHTML = `
  <span class='change-info'> ${user} (${num_changes} changes) - ${closed_at && new Date(closed_at)} </span>
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

  addToInfoFeed(changeset);
  playRandomNote();
};


const getData = async () => {

  const resp = await fetch("/latest-osm-changeset");
  const data: ChangeSetResp = await resp.json();

  const sortedClosedChangesets = data.changesets.filter(changeset => changeset.closed_at).sort((a, b) => {

    if (!a?.closed_at || !b?.closed_at) return;

    const aClosedAt = new Date(a.closed_at).getTime();
    const bClosedAt = new Date(b.closed_at).getTime();
    return aClosedAt - bClosedAt;

  })


  const baseTime = new Date(sortedClosedChangesets[0]?.closed_at || 0).getTime()

  for (const changeset of sortedClosedChangesets) {

    if (!changeset?.closed_at) return

    const offset = (new Date(changeset.closed_at).getTime() - baseTime)
    // console.log("🚀 settings intervals to play at mins: ", (offset / 1000) / 60)

    setTimeout(() => {
      newChangeSetCallBack(changeset)
    }, offset);
  }
}

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


    console.log(' get initial data..');
    getData()



    setInterval(async () => {

      console.log('fetching next changeset..')
      getData()

    }, ONE_MIN / 2);



  } else {
    console.error('DOM not ready');
  }
};

main();
