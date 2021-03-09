import Service from "./service"

import './style.css'

document.querySelector('#app').innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`

function callback(data) {
  console.log("callback function being run", data)
}

const service = new Service()
service.register(callback)
service.start()
