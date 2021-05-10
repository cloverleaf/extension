import browser from 'webextension-polyfill'
const copy = require('clipboard-copy')
const cloverleaf = require('cloverleaf')
const data = require('../data/siteUrls.json')

const cloverleafURL = 'https://cloverleaf.app/'

// https://bugzilla.mozilla.org/show_bug.cgi?id=1397667#c5
/**
 * Wait until the given tab reaches the "complete" status, then return the tab.
 *
 * This also deals with new tabs, which, before loading the requested page,
 * begin at about:blank, which itself reaches the "complete" status.
 */
async function tabCompletion (tab) {
  function isComplete (tab) {
    return tab.status === 'complete' && tab.url !== 'about:blank'
  }
  if (!isComplete(tab)) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        function giveUp () {
          browser.tabs.onUpdated.removeListener(onUpdated)
          if (isComplete(tab)()) {
            // Give it one last chance to dodge race condition
            // in which it completes between the initial test
            // and installation of the update listener.
            resolve(tab)
          } else {
            reject(new Error('Tab never reached the "complete" state, just ' + tab.status + ' on ' + tab.url))
          }
        },
        5000)
      function onUpdated (tabId, changeInfo, updatedTab) {
        // Must use updatedTab below; using just `tab` seems to remain
        // stuck to about:blank.
        if (tabId === updatedTab.id && isComplete(updatedTab)) {
          clearTimeout(timer)
          browser.tabs.onUpdated.removeListener(onUpdated)
          resolve(updatedTab)
        }
      }
      browser.tabs.onUpdated.addListener(onUpdated)
    })
  }
}

// Show a toast saying what's been done
function toast (tab, URL) {
  // If clicked on a not website page, don't show a unsupported site toast
  if (URL.protocol !== 'https:' && URL.protocol !== 'http:') return

  // TODO: Easter egg or something
  // If on cloverleaf already, do nothing
  if (URL.href === cloverleafURL) return

  // Wait until the tab is loaded
  tabCompletion(tab).then(function () {
    browser.tabs.sendMessage(tab.id, { unsupportedSite: URL })
  })
}

// https://stackoverflow.com/a/54961556/8456445
function goToURL (targetURL, passthrough) {
  browser.tabs.query({}).then(tabs => {
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      // If cloverleaf's already open
      if (tab.url === targetURL) {
        // Switch to it
        browser.tabs.update(tab.id, { active: true }).then((updated) => toast(updated, passthrough))
        return
      }
    }
    // Only done if no existing tab found
    browser.tabs.create({ url: targetURL }).then((made) => toast(made, passthrough))
  })
}

browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(tabs => {
    const tab = tabs[0]
    const url = new URL(tab.url)

    const getting = browser.storage.sync.get(['password', 'presetsOnly'])
    getting.then((response) => {
      const pass = response.password

      let alias

      // Try hostnames
      if (url.hostname in data.hostnames) {
        alias = data.hostnames[url.hostname]

        try {
          const out = cloverleaf.process(alias, pass, true)
          copy(out)
          browser.tabs.sendMessage(tab.id, { copied: alias })
        } catch (Error) {
          browser.tabs.sendMessage(tab.id, { error: 'preset: ' + url.hostname })
        }
      } else {
        // If no support for that site

        if (response.presetsOnly) {
          // Go to a cloverleaf tab or open one
          goToURL(cloverleafURL, url)
        } else {
          try {
            const out = cloverleaf.process(url.hostname, pass, false)
            copy(out)
            browser.tabs.sendMessage(tab.id, { generated: url.hostname })
          } catch (Error) {
            browser.tabs.sendMessage(tab.id, { error: 'site: ' + url.hostname })
          }
        }
      }
    })
  })
})
