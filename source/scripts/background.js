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
function toast (tab, passthrough) {
  const url = passthrough.url

  // If clicked on a not website page, don't show a unsupported site toast
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return

  // TODO: Easter egg or something
  // If on cloverleaf already, do nothing
  if (url.href === cloverleafURL) return

  // Wait until the tab is loaded
  tabCompletion(tab).then(function () {
    browser.tabs.sendMessage(tab.id, passthrough)
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
        browser.tabs.update(tab.id, {
          active: true
        }).then((updated) => {
          toast(updated, passthrough)
          // Also make sure its window is focused
          browser.windows.update(tab.windowId, {
            focused: true
          })
        })
        return
      }
    }
    // Only done if no existing tab found
    browser.tabs.create({
      url: targetURL
    }).then((made) => toast(made, passthrough))
  })
}

browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(tabs => {
    const tab = tabs[0]
    const url = new URL(tab.url)

    // If clicked on a not website page, open cloverleaf
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      goToURL(cloverleafURL, {
        message: 'nonSite',
        url: url
      })
      return
    }

    const getting = browser.storage.sync.get(['password', 'presetsOnly'])
    getting.then((response) => {
      const pass = response.password

      // If no password is set
      if (!pass) {
        // Display modal alerting the user
        browser.tabs.sendMessage(tab.id, {
          message: 'passwordNeeded'
        })
        return
      }

      let alias = ''
      const split = url.hostname.split('.')
      const secondLevel = split.slice(split.length - 2).join('.')

      // Try hostnames
      if (url.hostname in data.hostnames) {
        alias = data.hostnames[url.hostname]
      } else if (secondLevel in data.secondLevel) {
        // Try second-level
        alias = data.secondLevel[secondLevel]
      }

      if (alias !== '') {
        try {
          const out = cloverleaf.process(alias, pass, true)
          copy(out)
          browser.tabs.sendMessage(tab.id, {
            message: 'copied',
            alias: alias,
            url: url
          })
        } catch (e) {
          console.error(e)
          browser.tabs.sendMessage(tab.id, {
            message: 'error',
            url: url
          })
        }
      } else {
        // If no support for that site

        // If the user only wants to use existing presets
        if (response.presetsOnly) {
          // Go to a cloverleaf tab or open one
          goToURL(cloverleafURL, {
            message: 'unsupportedSite',
            url: url
          })
        } else {
          try {
            const out = cloverleaf.process(url.hostname, pass, false)
            copy(out)
            browser.tabs.sendMessage(tab.id, {
              message: 'generated',
              url: url
            })
          } catch (e) {
            console.error(e)
            browser.tabs.sendMessage(tab.id, {
              message: 'error',
              url: url
            })
          }
        }
      }
    })
  })
})

// On install or update
browser.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // Open the options page
    browser.runtime.openOptionsPage()
  }
})

browser.runtime.onMessage.addListener(function (request, sender) {
  if (request.message === 'openOptions') {
    browser.runtime.openOptionsPage()
  }
})
