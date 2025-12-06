const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

// Carrega config base do Expo
const config = getDefaultConfig(__dirname)

// Ajusta resolver
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  'xlsx', // Adicionar suporte para arquivos Excel
]

config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg', 'sql']

// Adiciona transformer SVG
config.transformer.babelTransformerPath =
  require.resolve('react-native-svg-transformer')

// Aplica NativeWind
module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
})
