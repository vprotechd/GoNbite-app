// const { getDefaultConfig } = require('expo/metro-config');

// const config = getDefaultConfig(__dirname);

// // ✅ Tell the bundler to use the web map version
// config.resolver.extraNodeModules = {
//   'react-native-maps': require.resolve('react-native-web-maps'),
// };

// // ✅ Ensure .pem files are allowed (required for maps)
// config.resolver.assetExts.push('pem');

// module.exports = config;


const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;