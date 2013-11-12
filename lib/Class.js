/* 
 * Forked by John Resig's Simple JavaScript Inheritance (http://ejohn.org/)
 * MIT Licensed.
 */
(function (win, doc, exports, undefined) {
 
    'use strict';
 
    var fnTest, initialize;
    
    fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    initialize = false;
 
    function Class() { /* noop. */ }
 
    Class.extend = function (props) {
 
        var SuperClass, prototype;
        
        SuperClass = this;
        
        initialize = true;
        prototype = new this();
        initialize = false;
 
        function Class() {
            if (initialize !== true && typeof this.init === 'function') {
                this.init.apply(this, arguments);
            }
        }
 
        for (var key in props) {
            var prop   = props[key],
                _super = SuperClass.prototype[key],
                isMethodOverride = (typeof prop === 'function' && typeof _super === 'function' && fnTest.test(prop));
 
            if (isMethodOverride) {
                prototype[key] = (function (fn, _super) {
                    return function () {
                        var ret,
                            tmp = this._super;
 
                        this._super = _super;
 
                        ret = fn.apply(this, arguments);
 
                        this._super = tmp;
 
                        return ret;
                    };
                }(prop, _super));
            }
            else {
                prototype[key] = prop;
            }
        }
 
        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        Class.extend = SuperClass.extend;
 
        return Class;
    };
 
    exports.Class = Class;
}(window, window.document, window));
