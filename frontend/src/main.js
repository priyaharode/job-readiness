import { registerSW } from 'virtual:pwa-register'
import './styles/global.css'
import { App } from './components/App.js'

// Register PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available! Reload?')) updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})

// Mount app
const root = document.getElementById('app')
root.innerHTML = App()

// Init interactions after mount
import('./components/interactions.js').then(m => m.init())
