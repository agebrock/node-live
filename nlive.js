
'use strict';

var _ = require('lodash');
var bluebird = ('bluebird');
var fs = require('fs');
var util = require('util');
var path = require('path');
var repl = require('repl');
var shelljs = require('shelljs');
var packages = require('./packages');

var context = {
  live:{
    loadPackages:packages
  },
  plugins:{},
  app:{},
  mongo:{}
};
context.x = shelljs.exec;


_.extend(context, packages());


var values;
try {
  values = require('./scope')(context);
} catch (e) {
  console.log(e);
  console.log(e.stack)
  console.log('WARN: Scope not loaded ! .. using empty one');
}

_.extend(global, context, values);



var replInstance = repl.start({
  useGlobal: true
});
var context = replInstance.context;
context.replInstance = replInstance;
//mod repl to implement custom comamnds
var originalEval = replInstance.eval;


function handleCommand(req) {
  var commands = {
    run: function() {
      try {
        options.context.cwd = require(process.cwd());
        console.log('package loaded into "cwd"');
      } catch (e) {
        console.log('failed to load local context')
      }
    }
  }
  if (req.command && commands[req.command]) {
    return commands[req.command];
  }
  return false;
}


function run(cmd, context, filename, callback) {
  var args = arguments;
  cmd = cmd.toString().trim('\n');

  var req = {
    args: arguments,
    cmd: cmd,
    filename: filename
  };


  if (handleCommand(req)) {
    return true;
  }
  var run = false;

  originalEval.apply(this, args);
}

replInstance.eval = run;
context.replInstance = replInstance;
module.exports = context;
