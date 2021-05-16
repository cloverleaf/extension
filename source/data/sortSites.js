const fs = require('fs')

const path = 'source/data/siteUrls.json'


function weirdSort (toSort) {

  const temp = {}

  // Make arrays of hostnames with single key per site
  for (const key in toSort) {
    const element = toSort[key]

    // If there's no array with that name make one
    if (!(element in temp)) temp[element] = []

    temp[element].push(key)
  }

  // Sort hostnames
  const secondTemp = {}
  for (const key in temp) {
    const element = temp[key]

    // // If there's no array with that name make one
    if (!(element in secondTemp)) secondTemp[key] = []

    // console.log(key, element.sort())
    secondTemp[key] = element.sort()
  }

  // Sort presets

  // Case insensitive sort
  function cmp (x, y) {
    if (x.toLowerCase() !== y.toLowerCase()) {
      x = x.toLowerCase()
      y = y.toLowerCase()
    }
    return x > y ? 1 : (x < y ? -1 : 0)
  }

  const thirdKeys = Object.keys(secondTemp).sort(cmp)

  // Build final list
  const final = {}

  // For preset
  for (let index = 0; index < thirdKeys.length; index++) {
    const element = thirdKeys[index]

    // For hostname
    const hostnames = secondTemp[element]

    for (let index = 0; index < hostnames.length; index++) {
      const hostname = hostnames[index]

      final[hostname] = element
    }
  }

  return final
}



fs.readFile(path, (err, result) => {
  if (err) throw err

  const json = JSON.parse(result)

  let out = {}
  out.hostnames = weirdSort(json.hostnames)
  out.secondLevel = weirdSort(json.secondLevel)
  out.WIP = json.WIP

  fs.writeFileSync(path, JSON.stringify(out, null, 2))
})
