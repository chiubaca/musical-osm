import Service from "./service"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import './style.css'


function main() {
  let map;
  if (document.readyState != 'loading') {
    console.log('dom ready');
    map = L.map('mapid').setView([30.0, 0.0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    let icon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div class='ripple'><div></div><div></div></div>",
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    map.addEventListener('click', (e) => {
      console.log(e)
      let icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='ripple'><div></div><div></div></div>",
      });
      L.marker([e.latlng.lat, e.latlng.lng], { icon: icon }).addTo(map)
    })

    function callback(data) {

      const { id, numChanges, user, userId, center, comment } = data
      // console.log("callback function being run", data)
      console.log("callback function being run", center)
      let icon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='ripple'><div></div><div></div></div>",
      });

      L.marker(center, { icon: icon }).addTo(map);
      // L.marker(center).addTo(map)
    }

    const service = new Service()
    service.register(callback)
    service.start()


  } else {
    console.log('Dom loading...')
  }
}


main()
