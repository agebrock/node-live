var plugin = {};

var scope = {
    "a": [1, 2, 3, 4, 5, 6, 7, 8, 9],
    "o": {
        "keyA": "valueA",
        "keyB": "valueB",
        "keyC": "valueC"
    },
    "fnc": function(paramA) {
        return paramA
    },
    plugin: plugin
}



var util = require('util');
scope.out = function(msg) {
    console.log(util.inspect(msg, true, 4));
}

scope.exec = function(cmd) {
    console.log(child_process.execSync(cmd).toString(), true);
}

scope.initLoopback = function() {
    plugin.loopback = require('loopback');
    plugin.app = plugin.loopback();

    plugin.model = plugin.loopback.PersistedModel.extend('CartItem', {
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
}

module.exports = scope;
