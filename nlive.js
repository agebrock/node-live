'use strict';

var _ = require('lodash'),
	bluebird = ('bluebird'),
	fs = require('fs'),
	util = require('util'),
	path = require('path'),
	repl = require('repl');

var context = {};


//mapping lodash to "_" seems to make problems with repl
var scopeMapping = {
	bluebird:'Promise',
	lodash:['lodash','l']
}


//_.extend(global, require('./lib/native-modules'));
var pkg = require('./package.json');
_.forEach(pkg.dependencies,function(pkgVersion, pkgName){

	var scopeName = pkgName;
	if(scopeMapping[scopeName]){
		scopeName = scopeMapping[scopeName];
	}
	console.log('Loading: %s into %s',pkgName, scopeName);
	var m = {};
	if(Array.isArray(scopeName)){
		scopeName.forEach(function(scopeName){
			m[scopeName] = require(pkgName);
		});
	}else{
		m[scopeName] = require(pkgName);
	}

	_.extend(context, m);
});
var values = require('./lib/values')


_.extend(global, context, {v:values});

var transformExtend = function(obj){
	return function(result, value, key) {
		result[key] =  l.extend(value, obj);
	}
}

var x = l.transform([{ 'a': 1},{ 'a': 2}], transformExtend({foooo:6666}));
console.log(x)
/*
global.dev = {};
_.forEach(pkg.devDependencies,function(pkgVersion, pkgName){
	var m = {};
	m[pkgName] = require(pkgName);
	_.extend(global.dev, {pkgName:require(pkgName)});
});
*/

/**
var passTo = function(fn){
return through2(function (chunk, enc, callback) {
	    fn(chunk);
	    callback(null, chunk);
	});
}
**/


console.log('Access exampledata: "v.array" ');
console.log(util.inspect(values,{colors:true,depth:null, showHidden:false}));


var replInstance = repl.start({useGlobal:true});
var context = replInstance.context;


//mod repl to implement custom comamnds
var originalEval = replInstance.eval;
function run(cmd, context, filename, callback) {


  return originalEval.apply(this, arguments);

}
replInstance.eval = run;


module.exports = context;

