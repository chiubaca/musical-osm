import Service from "./service"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import './style.css'

// https://codepen.io/teropa/pen/mBbPEe
const SCALE = [
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

function main() {
  let map;
  if (document.readyState != 'loading') {
    console.log('dom ready');
    map = L.map('mapid').setView([30.0, 0.0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    function callback(data) {

      const { id, numChanges, user, userId, center, comment } = data

      let icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='ripple'><div></div><div></div></div>",
      });

      L.marker(center, { icon: icon }).addTo(map);
      SCALE[Math.floor(Math.random() * SCALE.length)].play()
    }

    const service = new Service()
    service.register(callback)
    service.start()


  } else {
    console.log('Dom loading...')
  }
}

main()
