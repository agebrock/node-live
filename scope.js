var _ = require('lodash');

var child_process = require('child_process');

module.exports = function(scope) {

  var plugin = {};
  var chai = require('chai');
  var util = require('util');
  var Module = require('module');
  var path = require('path');

  _.extend(scope, {
    __dirname: __dirname,
    __filename: __filename,
    v: {
      s: 'Call this variables by "v.s, v.a ...."',
      a: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      o: {
        "keyA": "valueA",
        "keyB": "valueB",
        "keyC": {
          keyC1: 'valueC1'
        }
      },
      f: function(paramA) {
        return paramA;
      },
      d: new Date(),
      b: false
    }
  });

  console.log(util.inspect(scope.v, {
    colors: true
  }, 4));

  scope.module = new Module();


  scope.test = {
    s: scope.expect(scope.v.s),
    n: scope.expect(scope.v.n),
    o: scope.expect(scope.v.o),
    f: scope.expect(scope.v.f),
    d: scope.expect(scope.v.d),
    b: scope.expect(scope.v.b)
  };


  scope.out = function(msg) {
    console.log(util.inspect(msg, true, 4));
  };

  scope.exec = function(cmd) {
    console.log(child_process.execSync(cmd).toString(), true);
  };

  var live = scope.live;
  live.openFolder = function() {
    scope.exec('open ' + __dirname);
  };
  live.edit = function() {
    scope.exec('subl ' + path.join(__dirname));
  };
  live.reload = function() {
    delete require.cache[__filename];
    require(__filename);
  };
  live.foo = 1;


  scope.mongo.mongojs = function() {
    var mongo = scope.mongo;
    mongo.Db = require('mongojs/lib/database');
    mongo.Collection = require('mongojs/lib/collection');
    var db = scope.mongo.db = mongojs('nlive');
    scope.mongo.collection = db.collection('nlive');
  };

  scope.app.loopback = function() {
    scope.loopback = require('loopback');
    scope.app = plugin.loopback();
    scope.model = plugin.loopback.PersistedModel.extend('CartItem', {
      tax: {
        type: Number,
        default: 0.1
      },
      price: Number,
      item: String,
      qty: {
        type: Number,
        default: 0
      },
      cartId: Number
    });
  };


};
