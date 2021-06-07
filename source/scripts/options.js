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
    document.querySelector('#presets-only').checked = (result.presetsOnly !== undefined) ? result.presetsOnly : true
  }

  function onError (error) {
    console.error(`Error: ${error}`)
  }

  const getting = browser.storage.sync.get(['password', 'presetsOnly'])
  getting.then(setCurrentChoice, onError)
}

function togglePassword () {
  const x = document.getElementById('password')
  if (x.type === 'password') {
    x.type = 'text'
  } else {
    x.type = 'password'
  }
}

document.querySelector('#password').addEventListener('change', saveOptions)
document.getElementById('password-toggle').addEventListener('change', togglePassword)
document.querySelector('#presets-only').addEventListener('change', saveOptions)
document.addEventListener('DOMContentLoaded', restoreOptions)
// document.querySelector('form').addEventListener('submit', saveOptions)
