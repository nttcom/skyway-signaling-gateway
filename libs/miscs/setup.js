const fs = require('fs-extra')
const path = require('path')
const yaml = require('node-yaml')
const readline = require('readline')

const srcdir = path.join( __dirname, '/../../_conf')
const confdir = path.join( process.env.HOME, "/.ssg")

function askAPIKEY() {
  return new Promise((resolve, reject) => {
    try {
      if(process.env.SSG_APIKEY) {
        resolve(process.env.SSG_APIKEY)
      } else {
        const reader = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        reader.question('Input your SkyWay API Key : ', (apikey) => {
          resolve(apikey)
          reader.close()
        })
      }
    } catch(err) {
      reject(err)
    }
  })
}

function updateAPIKEY(apikey) {
  try {
    const file = path.join(confdir, "/skyway.yaml")
    let conf = yaml.readSync(file)
    conf = Object.assign({}, conf, {apikey: apikey})
    yaml.writeSync(file, conf)
    return Promise.resolve()
  } catch(err) {
    return Promise.reject(err)
  }
}


module.exports.do_setup = () => {
  fs.copySync(srcdir, confdir)
  askAPIKEY()
    .then(apikey => updateAPIKEY(apikey))
    .then(() => console.log('setup finished'))
    .catch(err => console.warn(`Error during setup ${err.message}`) )
}

module.exports.check_conf = () => {
  try {
    console.log(confdir)
    fs.pathExistsSync(confdir)
    return true
  } catch(err) {
    console.warn(err.message)
    console.warn("run 'ssg setup' first.")
    return false
  }
}

module.exports.reset_conf = () => {
  try {
    fs.removeSync( confdir )
  } catch(err) {
    console.warn(err.message)
  }
}
