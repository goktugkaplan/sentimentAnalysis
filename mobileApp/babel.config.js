module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // diğer pluginler...
    'react-native-reanimated/plugin', // <- en sonda olmalı
  ],
};
