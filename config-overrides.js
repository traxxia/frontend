const path = require('path');

module.exports = function override(config, env) {
  // Resolve '@' to 'src'
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src')
  };

  return config;
};
