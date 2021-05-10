import browser from 'webextension-polyfill'
// Import what we need from materialize
import '../../node_modules/@materializecss/materialize/js/cash'
import '../../node_modules/@materializecss/materialize/js/component.js'
import '../../node_modules/@materializecss/materialize/js/global.js'
import '../../node_modules/@materializecss/materialize/js/anime.min.js'
import '../../node_modules/@materializecss/materialize/js/toasts.js'

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.unsupportedSite) {
    const url = new URL(message.unsupportedSite)

    window.M.toast({
      html: `${url.hostname} isn't supported yet`,
      classes: 'warning'
    })
  } else if (message.copied) {
    window.M.toast({ text: 'Used preset ' + message.copied, classes: 'success' })
  } else if (message.generated) {
    window.M.toast({ text: 'Generated a password for ' + message.generated, classes: 'success' })
  } else if (message.error) {
    window.M.toast({ text: 'Error generating password for ' + message.error, classes: 'warning' })
  }
})
