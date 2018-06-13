var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var JString = java.lang.String
var Paths = Java.type('java.nio.file.Paths')
var StandardCharsets = Java.type('java.nio.charset.StandardCharsets')

function log (str) {
    java.lang.System.out.print(str);
  }

function show() {
    var args = Array.prototype.slice.call(arguments).map(function (arg) {
        return (arg && arg.constructor && (arg.constructor.name == "Array" || arg.constructor.name === "Object"))
            ? JSON.stringify(arg)
            : arg
    })

    print.apply(null, args)
}

var console = {
    debug: show,
    warn: show,
    log: show,
    error: show,
    trace: show
};

function identity(i) {
    return i;
}

function btoa(decodedString) {
    var encoder = java.util.Base64.getEncoder()

    return new String(new JString(encoder.encode(new JString(decodedString).getBytes(StandardCharsets.UTF_8))))
}

function atob(encodedString) {
    var decoder = java.util.Base64.getDecoder()

    return new String(new JString(decoder.decode(new JString(encodedString).getBytes(StandardCharsets.UTF_8))))
}


if (!Object.assign) {
    Object.defineProperty(Object, "assign", {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function (target) {
            "use strict";
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
        return Object.getOwnPropertyNames(target).map(function (k) {
            return target[k]
        })
    }
}


if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        }
    });
}


if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}


/**
 * nashorn-promise
 *
 * @author hidekatsu.izuno@gmail.com (Hidekatsu Izuno)
 * @license MIT License
 */



var JCompletableFuture = Java.type('java.util.concurrent.CompletableFuture');
var JCompleteFutureArray = Java.type('java.util.concurrent.CompletableFuture[]');
// var JPromiseException = Java.type('net.arnx.nashorn.lib.PromiseException');
var JPromiseException = function (result) {
    this.result = result
    this.getResult = function () { return this.result }
}

var _global_ = this
var Promise = function (resolver, futures) {
    var that = this;
    if (resolver instanceof JCompletableFuture) {
        that._future = resolver;
        that._futures = futures;
    } else {
        var func = Java.synchronized(function () {
            var status, result;
            (0, resolver)(function (value) {
                status = 'fulfilled';
                result = value;
            }, function (reason) {
                status = 'rejected';
                result = reason;
            });
            if (status == 'fulfilled') {
                return {
                    result: result
                };
            } else if (status == 'rejected') {
                throw new JPromiseException(result);
            }
        }, _global_);
        if (Promise._pool) {
            that._future = JCompletableFuture.supplyAsync(func, Promise._pool);
        } else {
            that._future = JCompletableFuture.supplyAsync(func);
        }
    }
};

Promise.all = function (array) {
    var futures = array.map(function (elem) {
        if (elem instanceof Promise) {
            return elem._future;
        }
        return Promise.resolve(elem)._future;
    });
    return new Promise(JCompletableFuture.allOf(Java.to(futures, JCompleteFutureArray)), futures);
};

Promise.race = function (array) {
    var futures = array.map(function (elem) {
        if (elem instanceof Promise) {
            return elem._future;
        }
        return Promise.resolve(elem)._future;
    });
    return new Promise(JCompletableFuture.anyOf(Java.to(futures, JCompleteFutureArray)));
};

Promise.resolve = function (value) {
    if (value instanceof Promise) {
        return value;
    } else if (value != null
        && (typeof value === 'function' || typeof value === 'object')
        && typeof value.then === 'function') {
        return new Promise(function (fulfill, reject) {
            try {
                return {
                    result: value.then(fulfill, reject)
                }
            } catch (e) {
                throw new JPromiseException(e);
            }
        });
    } else {
        return new Promise(JCompletableFuture.completedFuture({
            result: value
        }));
    }
};

Promise.reject = function (value) {
    return new Promise(function (fulfill, reject) {
        reject(value);
    });
};

Promise.prototype.then = function (onFulfillment, onRejection) {
    var that = this;
    return new Promise(that._future.handle(function (success, error) {
        if (success == null && error == null && that._futures != null) {
            success = {
                result: that._futures.map(function (elem) {
                    return elem.get().result;
                })
            };
        }

        if (success != null) {
            if (typeof onFulfillment === 'function') {
                try {
                    var value = success.result;
                    if (value instanceof Promise) {
                        return {
                            result: (0, onFulfillment)(value._future.get().result)
                        };
                    }
                    return {
                        result: (0, onFulfillment)(success.result)
                    };
                } catch (e) {
                    throw new JPromiseException(e)
                }
            }
            return success;
        } else if (error != null) {
            var cerror = error;
            do {
                if (cerror instanceof JPromiseException) {
                    error = cerror;
                    break;
                }
            } while ((cerror = cerror.getCause()) != null);

            if (typeof onRejection === 'function') {
                try {
                    var reason = error;
                    if (error instanceof JPromiseException) {
                        reason = error.getResult();
                    }

                    return {
                        result: (0, onRejection)(reason)
                    };
                } catch (e) {
                    throw new JPromiseException(e)
                }
            }
            throw error;
        }
    }));
};

Promise.prototype.catch = function (onRejection) {
    return this.then(null, onRejection);
};


// https://gist.github.com/josmardias/20493bd205e24e31c0a406472330515a at least
// one timeout needs to be set, larger then your code bootstrap or Nashorn will
// run forever preferably, put a timeout 0 after your code bootstrap

var Timer = Java.type('java.util.Timer');
var Phaser = Java.type('java.util.concurrent.Phaser');

// var timer = new Timer('jsEventLoop', false);
// var phaser = new Phaser();
var timer
var phaser

var timeoutStack = 0;

function pushTimeout() {
    timeoutStack++;
}

function popTimeout() {
    timeoutStack--;
    if (timeoutStack > 0) {
        return;
    }
    timer.cancel();
    phaser.forceTermination();
}

var onTaskFinished = function () {
    phaser.arriveAndDeregister();
};

function setTimeout(fn, millis /* [, args...] */) {
    var args = [].slice.call(arguments, 2, arguments.length);

    timer = (timer === undefined) ? new Timer('jsEventLoop', false) : timer
    phaser = (phaser === undefined) ? new Phaser() : phaser

    var phase = phaser.register();
    var canceled = false;
    timer.schedule(function () {
        if (canceled) {
            return;
        }

        try {
            fn.apply(context, args);
        } catch (e) {
            print(e);
        } finally {
            onTaskFinished();
            popTimeout();
        }
    }, millis);

    pushTimeout();

    return function () {
        onTaskFinished();
        canceled = true;
        popTimeout();
    };
};

function clearTimeout(cancel) {
    cancel();
};

function setInterval(fn, delay /* [, args...] */) {
    var args = [].slice.call(arguments, 2, arguments.length);

    var cancel = null;

    var loop = function () {
        cancel = setTimeout(loop, delay);
        fn.apply(context, args);
    };

    cancel = setTimeout(loop, delay);
    return function () {
        cancel();
    };
};

function clearInterval(cancel) {
    cancel();
};
