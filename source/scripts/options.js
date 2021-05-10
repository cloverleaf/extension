import browser from 'webextension-polyfill'
// import '../styles/options.scss'

function saveOptions (e) {
  e.preventDefault()
  browser.storage.sync.set({
    password: document.querySelector('#password').value,
    presetsOnly: document.getElementById('presets-only').checked
  })
}

function restoreOptions () {
  function setCurrentChoice (result) {
    document.querySelector('#password').value = result.password || ''
  }

  function onError (error) {
    console.log(`Error: ${error}`)
  }

  const getting = browser.storage.sync.get('password')
  getting.then(setCurrentChoice, onError)
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.querySelector('form').addEventListener('submit', saveOptions)
