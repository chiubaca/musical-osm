import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './style.scss';
import { ChangeSetResp, Changeset } from './common/types';

/**
 * Nice sounding chords taken from https://codepen.io/teropa/pen/mBbPEe
 */
const SCALES = [
  new Audio('chords/scale-A2.mp3'),
  new Audio('chords/scale-G2.mp3'),
  new Audio('chords/scale-C3.mp3'),
  new Audio('chords/scale-D3.mp3'),
  new Audio('chords/scale-E3.mp3'),
  new Audio('chords/scale-E4.mp3'),
  new Audio('chords/scale-G3.mp3'),
  new Audio('chords/scale-A3.mp3'),
  new Audio('chords/scale-C4.mp3'),
  new Audio('chords/scale-D4.mp3'),
];

const ONE_MIN = 60000;

/**
 * Leaflet map
 */
let map: L.Map;

/**
 * Plays a a random chord
 */
const playRandomNote = () => {
  SCALES[Math.floor(Math.random() * SCALES.length)].play();
};

/**
 * Adds details of the OSM changeset to the info feed
 */
const addToInfoFeed = (changesetDetails: Changeset) => {
  const { user, num_changes, closed_at } = changesetDetails;

  const infoFeedElement = document.querySelector("#info-feed")

  if (!infoFeedElement) return;

  infoFeedElement.innerHTML = `
  <span class='change-info'> ${user} (${num_changes} changes) - ${closed_at ? new Date(closed_at) : ""
    } </span>  
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

  const marker: L.Marker = L.marker([min_lat, max_lon], { icon })
    .bindPopup(`${user} - (${num_changes} changes)`)
    .addEventListener('mouseover', () => marker.togglePopup())
    .addEventListener('mouseout', () => marker.togglePopup())
    .addTo(map);

  addToInfoFeed(changeset);
  playRandomNote();
};


const getLatestChangeset = async () => {
  const resp = await fetch("/latest-osm-changeset");
  const data: ChangeSetResp = await resp.json();

  // Filter out any changesets that are still open
  // Then sort by closed_at date so that the oldest changesets are first
  const sortedClosedChangesets = data.changesets
    .filter((changeset) => changeset?.closed_at)
    .sort((a, b) => {
      if (!a?.closed_at || !b?.closed_at) return 0;

      const aClosedAt = new Date(a.closed_at).getTime();
      const bClosedAt = new Date(b.closed_at).getTime();

      return aClosedAt - bClosedAt;
    });

  // Take the first change to be used as the base time so we can create 
  // a timing offset for all other relative to this.
  const baseTime = new Date(
    sortedClosedChangesets[0]?.closed_at || 0
  ).getTime();

  // Queue up all closed changes to be played in sequence.
  for (const changeset of sortedClosedChangesets) {
    if (!changeset?.closed_at) return;

    const offset = new Date(changeset.closed_at).getTime() - baseTime;

    setTimeout(() => {
      newChangeSetCallBack(changeset);
    }, offset);
  }
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


    // Get the initial changeset for when the app loads
    getLatestChangeset()

    setInterval(async () => {
      getLatestChangeset()
    }, ONE_MIN / 2);


  } else {
    console.error('DOM not ready');
  }
};

main();
