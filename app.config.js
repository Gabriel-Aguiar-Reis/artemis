const baseConfig = require('./app.json')

let brandConfig = {}
try {
  brandConfig = require('./brand.config.js')
} catch {
  // Sem brand config → usa o padrão (Artemis)
}

const appName = brandConfig.appName ?? baseConfig.expo.name

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    name: appName,
  },
}
