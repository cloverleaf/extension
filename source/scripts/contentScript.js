import browser from 'webextension-polyfill'
// Import what we need from materialize
import '../../node_modules/@materializecss/materialize/js/cash'
import '../../node_modules/@materializecss/materialize/js/component.js'
import '../../node_modules/@materializecss/materialize/js/global.js'
import '../../node_modules/@materializecss/materialize/js/anime.min.js'
import '../../node_modules/@materializecss/materialize/js/toasts.js'

browser.runtime.onMessage.addListener((response, sender, sendResponse) => {
  switch (response.message) {
    case 'unsupportedSite':
      window.M.toast({
        text: `${new URL(response.url).hostname} isn't supported yet`,
        classes: 'warning'
      })
      break

    case 'copied':
      window.M.toast({
        text: `Used ${response.alias} preset`,
        classes: 'success'
      })
      break

    case 'generated':
      window.M.toast({
        text: `Generated a password for ${new URL(response.url).hostname}`,
        classes: 'middling'
      })
      break

    case 'error':
      window.M.toast({
        text: `Error generating password for ${response.url}`,
        classes: 'warning'
      })
      break

    case 'passwordNeeded':
      if (window.confirm('You need to set a password before using this')) {
        // Open the options page
        browser.runtime.sendMessage({ message: 'openOptions' })
      }
      break

    default:
      window.M.toast({
        text: 'Please report this',
        classes: 'warning'
      })
      break
  }
})
