let a = 1;

require = function () { // eslint-disable-line no-global-assign
  return 'value';
}

exports = require('./anypath');
