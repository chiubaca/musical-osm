import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { ChangeSetResp, Changeset } from './common/types';
import { A2, G2, C3, D3, E3, E4, G3, A3, C4, D4 } from './chords'

const SCALES = [
  new Audio(A2),
  new Audio(G2),
  new Audio(C3),
  new Audio(D3),
  new Audio(E3),
  new Audio(E4),
  new Audio(G3),
  new Audio(A3),
  new Audio(C4),
  new Audio(D4),
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
  const { user, num_changes, closed_at, id } = changesetDetails;

  const infoFeedElement = document.querySelector("#info-feed")

  if (!infoFeedElement) return;

  infoFeedElement.innerHTML = `
  <span class="change-info">
    ${num_changes} changes by 
    <a 
      href='https://www.openstreetmap.org/user/${user}' 
      target="_blank" 
      rel="noopener noreferrer">
      ${user}</a> |
    <a href='https://www.openstreetmap.org/changeset/${id}' target="_blank" rel="noopener noreferrer"> view changes </a> 
    <br/> closed at ${closed_at ? new Date(closed_at) : ""}
  </span>  
`;
};


/**
 * Callback function which runs on every OSM changeset that is added.
 */
const newChangeSetCallBack = (changeset: Changeset) => {
  const {
    user, min_lat, max_lon, num_changes, id
  } = changeset;

  const icon = L.divIcon({
    className: 'ripple',
    html: '<div><div class="ring"></div><div class="ring"></div><div class="point"></div></div>',
  });

  const marker: L.Marker = L.marker([min_lat, max_lon], { icon })
    .bindPopup(`
      ${num_changes} changes by <a href='https://www.openstreetmap.org/user/${user}' target="_blank" rel="noopener noreferrer">${user}</a>
      <div><a href='https://www.openstreetmap.org/changeset/${id}' target="_blank" rel="noopener noreferrer"> View changes </a></div>
      `)
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

    // Get a fresh changeset every 30 seconds 
    setInterval(async () => {
      getLatestChangeset()
    }, ONE_MIN / 2);


  } else {
    console.error('DOM not ready');
  }
};

main();
