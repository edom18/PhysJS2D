var Phys2D = {};

(function (exports) {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight;

    var DEG_TO_RAD = Math.PI / 180;

    var xAxis = vec2.right,
        yAxis = vec2.up;

    function sortFunc(a, b) {
        return a - b;
    }

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
            this.position = vec2(0.0);
            this.rotation = 0;
            this.scaling  = vec2(1.0);

            this.translateMatrix = mat3();
            this.rotationMatrix = mat3();
            this.scaleMatrix = mat3();

            this.vertices = [];
            this.AABB = {
                minX: 0, maxX: 0,
                minY: 0, maxY: 0
            };
        },

        draw  : nullFunction,
        update: nullFunction,

        //現在の頂点情報から、AABBの情報を得る
        getAABB: function () {

            var vertices = this.getVertices();
            var dot;
            var temp = [];

            //X軸のmin, maxを得る
            for (var i = 0, l = vertices.length; i < l; i++) {
                temp.push(vec2.dot(xAxis, vertices[i]));
            }

            temp.sort(sortFunc);
            this.AABB.minX = temp[0] * 1.01;
            this.AABB.maxX = temp[vertices.length - 1] * 1.01;

            //Y軸のmin, maxを得る
            temp = [];
            for (var i = 0, l = vertices.length; i < l; i++) {
                temp.push(vec2.dot(yAxis, vertices[i]));
            }

            temp.sort(sortFunc);
            this.AABB.minY = temp[0] * 1.01;
            this.AABB.maxY = temp[vertices.length - 1] * 1.01;

            return this.AABB;
        },

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
            this.position = vec2.add(this.position, vec);
            this.translateMatrix = mat3.translate(this.position);

            this.matrix = mat3.multiply(this.translateMatrix, this.rotationMatrix);
            this.matrix = mat3.multiply(this.matrix, this.scaleMatrix);
        },

        /**
         * Rotate object.
         * @param {number} deg
         */
        rotate: function (deg) {
            this.rotation += deg * DEG_TO_RAD;
            this.rotationMatrix = mat3.rotate(this.rotation);

            this.matrix = mat3.multiply(this.translateMatrix, this.rotationMatrix);
            this.matrix = mat3.multiply(this.matrix, this.scaleMatrix);
        },

        /**
         * Scaled object.
         * @param {vec2} scale
         */
        scale: function (scale) {
            this.scaling = vec2.multiply(this.scaling, scale);
            this.scaleMatrix = mat3.scale(this.scaling);

            this.matrix = mat3.multiply(this.translateMatrix, this.rotationMatrix);
            this.matrix = mat3.multiply(this.matrix, this.scaleMatrix);
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

            // this.update(scene);

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
