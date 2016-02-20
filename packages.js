var _ = require('lodash');

//_.extend(global, require('./lib/native-modules'));
//mapping lodash to "_" seems to make problems with repl



var scopeMapping = {
  bluebird: ['Promise'],
  lodash: ['lodash', 'l']
};

module.exports = function(flush) {
  if (flush) {
    require.cache = {};
  }
  var pkg = require('./package.json');
  var m = {};
  _.forEach(pkg.dependencies, function(pkgVersion, pkgName) {

    var scopeName = pkgName;

    if (scopeMapping[scopeName]) {
      scopeName = scopeMapping[scopeName];
    }



    if (Array.isArray(scopeName)) {
      scopeName.forEach(function(scopeName) {
        console.log('Loading: %s into %s', pkgName, scopeName);
        m[scopeName] = require(pkgName);
      });
    } else {
      scopeName = _.camelCase(scopeName);
      console.log('Loading: %s into %s', pkgName, scopeName);
      m[scopeName] = require(pkgName);
    }


  });
  return m;
};
