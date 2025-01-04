// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  root: './src',
  mount: {
    /* ... */
    
  },
  plugins: [
    ['snowpack-plugin-less', {}]
  ],
  packageOptions: {
    /* ... */
    knownEntrypoints: ['has-symbols', 'call-bind']
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
    style: 'compressed', // 'compressed' or 'expanded'
  },
  
};
