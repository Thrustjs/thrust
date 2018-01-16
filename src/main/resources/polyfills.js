var exports = {};
var global = this;
var self = this;
var window = this;
var process = {
    env: {}
};

function show() {
    var args = Array.prototype.slice.call(arguments).map(function(arg) {
        return (arg && arg.constructor && (arg.constructor.name == "Array" || arg.constructor.name === "Object"))
            ? JSON.stringify(arg)
            : arg
    })

    print.apply(null, args)
}

var console = {};
console.debug = show;
console.warn = show;
console.log = show;
console.error = show;
console.trace = show;

if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert first argument to object');
            }
            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource === undefined || nextSource === null) {
                    continue;
                }
                nextSource = Object(nextSource);
                var keysArray = Object.keys(Object(nextSource));
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        }
    });
}

if (!Object.values) {
    Object.values = function values(target) {
        return Object.getOwnPropertyNames(target).map(function(k) {
            return target[k]
        })
    }
}

if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
            if (this == null) {
                throw new TypeError('\\\\\\\"this\\\\\\\" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var thisArg = arguments[1];
            var k = 0;
            while (k < len) {
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                k++;
            }
            return undefined;
        }
    });
}