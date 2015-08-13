'use strict';

var _ = require('lodash'),
    bluebird = ('bluebird'),
    fs = require('fs'),
    util = require('util'),
    path = require('path'),
    repl = require('repl'),
    shelljs = require('shelljs');

var context = {};
context.x = shelljs.exec;
//mapping lodash to "_" seems to make problems with repl
var scopeMapping = {
    bluebird: ['Promise'],
    lodash: ['lodash', 'l']
};

//_.extend(global, require('./lib/native-modules'));
var pkg = require('./package.json');

_.forEach(pkg.dependencies, function(pkgVersion, pkgName) {

    var scopeName = pkgName;

    if (scopeMapping[scopeName]) {
        scopeName = scopeMapping[scopeName];
    }

    var m = {};

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

    _.extend(context, m);
});
var values = {};

try {
    values = require('./scope');
} catch (e) {
    console.log('WARN: Scope not loaded ! .. using empty one')
}

_.extend(global, context, values);

console.log('Your extended scope:');
console.log(util.inspect(values, {colors: true, depth: null, showHidden: false}));

var replInstance = repl.start({useGlobal: true});
var context = replInstance.context;
context.replInstance = replInstance;
//mod repl to implement custom comamnds
var originalEval = replInstance.eval;

function run(cmd, context, filename, callback) {
    var args = arguments;
    cmd = cmd.toString().trim('\n');
    if (cmd == 'run') {
        try {
            context.cwd = require(process.cwd());
            console.log('package loaded into "cwd"')
        } catch (e) {
            console.log('failed to load local context')
        }
        return true;
    }
    var run = false;

    originalEval.apply(this, args);
}

replInstance.eval = run;
context.replInstance = replInstance;
module.exports = context;
