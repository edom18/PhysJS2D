var Phys2D = {};

(function (exports) {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight;

    var DEG_TO_RAD = Math.PI / 180;

    function nullFunction() {
        //null
    }

    /**
     * 座標を直交座標に直す
     *
     * @param {number} x
     * @param {number} y
     */
    function convertPoint(x, y) {

        var ret = vec2(0.0);

        ret.x = x - w / 2;
        ret.y = h - (h / 2 + y);

        return ret;
    }

    var Object2D = Class.extend({
        init: function () {
            this.matrix   = mat3();
            this.position = mat3();
            this.rotation = mat3();
            this.scaling  = mat3();
            this.vertices = [];
        },

        draw  : nullFunction,
        update: nullFunction,

        /**
         * @return {Array.<vec2>}
         */
        getVertices: function () {
            var vertices = this.vertices;
            var matrix = this.matrix;
            var ret = [];

            for (var i = 0, l = vertices.length; i < l; i++) {
                ret.push(vec2.applyMatrix3(vertices[i], matrix));
            }

            return ret;
        },

        /**
         * Translate object.
         * @param {vec2} vec
         */
        translate: function (vec) {
            var temp = mat3.translate(vec);
            this.matrix = mat3.multiply(temp, this.matrix);
            this.position = vec2.add(this.position, vec);
            //temp = mat3.multiply(this.rotation, this.position);
            //temp = mat3.multiply(temp, this._scale);
            //this.matrix = temp;
        },

        /**
         * Rotate object.
         * @param {number} deg
         */
        rotate: function (deg) {
            var temp = mat3.rotate(deg * DEG_TO_RAD);
            this.matrix = mat3.multiply(temp, this.matrix);
            this.rotation += deg;

            // temp = mat3.multiply(this.rotation, this.position);
            // temp = mat3.multiply(temp, this._scale);
            // this.matrix = temp;
        },

        /**
         * Scaled object.
         * @param {vec2} scale
         */
        scale: function (scale) {
            var temp = mat3.scale(scale);
            this.matrix = mat3.multiply(temp, this.matrix);
            this.scaling = vec2.add(this.scaling, scale);

            // temp = mat3.multiply(this.rotation, this.position);
            // temp = mat3.multiply(temp, this._scale);
            // this.matrix = temp;
        },

        /**
         * Set a color to a object.
         * @param {string} color
         */
        setColor: function (color) {
            this._color = color;
        }
    });


    var Line = Object2D.extend({
        init: function (start, end, opt) {

            opt || (opt = {});

            this._start = start;
            this._end = end;
            this._color = opt.color || 'black';
        },
        draw: function (ctx, center) {
            ctx.save();
            ctx.strokeStyle = this._color;
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.moveTo(this._start.x, -this._start.y);
            ctx.lineTo(this._end.x, -this._end.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    });

    var Point = Object2D.extend({
        init: function (pos, opt) {

            opt || (opt = {});

            this._pos = pos;
            this._radius = opt.radius || 5;
            this._color = opt.color || 'black';
        },
        draw: function (ctx, center) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.arc(this._pos.x, -this._pos.y, this._radius, Math.PI * 2, false);
            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
    });

    /**
     * Scene class
     * @class
     */
    var Scene = Class.extend({
        init:function () {
            this.objects = [];
        },
        length: function () {
            return this.objects.length;
        },
        add: function (obj2d) {
            this.objects.push(obj2d);
        },
        //TODO
        remove: function (obj2d) {

        },
        clear: function () {
            this.objects = [];
        }
    });

    /**
     * Renderer
     * @class
     */
    var Renderer = Class.extend({
        init: function (cv) {
            this._cv  = cv;
            this._ctx = cv.getContext('2d');
            this._center = {
                x: cv.width / 2,
                y: cv.height / 2
            };
        },
        update: function (scene) {
            for (var i = 0, l = scene.length(); i < l; i++) {
                scene.objects[i].update();
            }
        },
        render: function (scene) {
            var ctx = this._ctx;
            var center = this._center;

            this.update(scene);

            for (var i = 0, l = scene.length(); i < l; i++) {
                scene.objects[i].draw(ctx, center);
            }
        }
    });

        
    /**
     * 線分と点との最短点を検出する
     * @param {vec2} e0 端点0
     * @param {vec2} e1 端点1
     * @param {vec2} p  判別したい点
     * @return {vec2} 検出した最短点の位置
     */
    function detectPointOnLine(e0, e1, p) {

        //端点0〜1のベクトル
        var vec = vec2.sub(e1, e0);

        //上記で求めたベクトルの長さ
        var a = vec2.lengthSqr(vec);

        //端点0から点までのベクトル
        var e0p = vec2.sub(e0, p);

        //aが0の場合は、e0 == e1、つまり「点」になるので
        //点と点の距離、つまり端点e0が最短点
        if (a === 0) {
            return vec2(e0);
        }

        var b = vec.x * (e0.x - p.x) + vec.y * (e0.y - p.y);

        //a : bの係数を計算
        var t = -(b / a);

        //0.0〜1.0にクランプする
        t = Math.min(1.0, Math.max(t, 0.0));

        //求まった係数 t を元に、垂線の足の位置を計算
        var x = t * vec.x + e0.x;
        var y = t * vec.y + e0.y;

        //垂線の足の位置ベクトルを返す
        return vec2(x, y);
    }

    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    exports.convertPoint = convertPoint;
    exports.Object2D = Object2D;
    exports.Point    = Point;
    exports.Line     = Line;
    exports.Scene    = Scene;
    exports.Renderer = Renderer;
    exports.detectPointOnLine = detectPointOnLine;

}(Phys2D));
