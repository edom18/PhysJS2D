(function (exports) {
    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight;

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

        },
        draw: function (ctx, center) {

        },
        update: function () {

        },
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
     * 三角形クラス
     *
     * @class
     * @param {vec2} v1
     * @param {vec2} v2
     * @param {vec2} v3
     * @param {number} mass
     */
    var Triangle = Object2D.extend({
        init: function (v1, v2, v3, opt) {

            opt || (opt = {});

            this.mass   = opt.mass || 1;
            this._color = opt.color || 'black';
            this.angularAcc = 0;
            this.angularVelocity = 0;
            this.position = mat3.translate(vec2(0.0));
            this.scale = mat3.scale(vec2(1.0));
            this.angle = 0;
            this._originalVertices = [vec2(v1), vec2(v2), vec2(v3)];
            this.vertices = [v1, v2, v3];
            this.calcInertia();

            if (opt.useCenter) {
                this._calcCenter();
            }
        },

        /**
         * 重心を求め、原点に合わせる
         * CoG = 1 / 3(v1 + v2 + v3);
         */
        _calcCenter: function () {

            var v1 = this.vertices[0];
            var v2 = this.vertices[1];
            var v3 = this.vertices[2];

            var center = vec2.add(v1, v2);
            center = vec2.add(center, v3);
            center = vec2.multiplyScalar(center, -1 / 3);

            this._center = center;
            this.position = mat3.translate(center);

            //var cp_v1 = vec2.applyMatrix3(v1, this._center);
            //var cp_v2 = vec2.applyMatrix3(v2, this._center);
            //var cp_v3 = vec2.applyMatrix3(v3, this._center);

            //this.vertices = [
            //    cp_v1, cp_v2, cp_v3
            //];
        },
        
        /**
         * 重心の慣性テンソルを計算
         * 
         * I = 1/18m(|v_1|^2 + |v_2|^2 + |v_3|^2 - v_2・v_3 - v_3・v_1 - v_1・v_2)
         *
         */
        calcInertia: function () {
            var v1 = this.vertices[0];
            var v2 = this.vertices[1];
            var v3 = this.vertices[2];
            
            var v1len = vec2.lengthSqr(v1);
            var v2len = vec2.lengthSqr(v2);
            var v3len = vec2.lengthSqr(v3);
            var v2v3 = vec2.dot(v2, v3);
            var v3v1 = vec2.dot(v3, v1);
            var v1v2 = vec2.dot(v1, v2);

            var I = (1 / 18) * this.mass * (v1len + v2len + v3len - v2v3 - v3v1 - v1v2);

            this.inertia = I;
        },

        /**
         * 設定をリセットする
         */
        reset: function () {
            this.angularVelocity = 0;
            this.angle = 0;
            this.angularAcc = 0;
            this.calcInertia();
        },

        /**
         * レンダリング
         */
        draw: function (ctx, center) {
            var model = this.position;
            var scale = this.scale;
            var rot = mat3.rotate(this.angle * Math.PI / 180);
            model = mat3.multiply(rot, model);
            model = mat3.multiply(model, scale);

            var vertices = this.vertices;
            var v0 = vec2(vertices[0]);
            var v1 = vec2(vertices[1]);
            var v2 = vec2(vertices[2]);

            v0 = vec2.applyMatrix3(v0, model);
            v1 = vec2.applyMatrix3(v1, model);
            v2 = vec2.applyMatrix3(v2, model);

            ctx.save();
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.moveTo(v0.x, -v0.y);
            ctx.lineTo(v1.x, -v1.y);
            ctx.lineTo(v2.x, -v2.y);
            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        },

        /**
         * 座標位置をアップデート
         */
        update: function () {
            this.angularAcc *= 0.5;
            this.angularVelocity += this.angularAcc;
            this.angle += this.angularVelocity;
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
        }
    });

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

    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    exports.convertPoint = convertPoint;
    exports.Object2D = Object2D;
    exports.Point    = Point;
    exports.Line     = Line;
    exports.Triangle = Triangle;
    exports.Scene    = Scene;
    exports.Renderer = Renderer;

}(window));

(function () {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight,
        hw = w / 2,
        hh = h / 2;

    var cv, ctx;

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

    document.addEventListener('DOMContentLoaded', function () {
        cv = document.querySelector('#cv');
        cv.width  = w;
        cv.height = h;
        ctx = cv.getContext('2d');

        var scene = new Scene();
        var renderer = new Renderer(cv);

        var x, y;

        x = Math.random() * w;
        y = Math.random() * h;
        var v1 = convertPoint(x, y);

        x = Math.random() * w;
        y = Math.random() * h;
        var v2 = convertPoint(x, y);

        x = Math.random() * w;
        y = Math.random() * h;
        var v3 = convertPoint(x, y);

        //var v1 = vec2(205, -50);
        //var v2 = vec2(130, 150);
        //var v3 = vec2(-130, -120);

        //三角形をひとつ作る
        var triangle = new Triangle(v1, v2, v3, {
            mass: 5,
            color: '#c00'
        });

        scene.add(triangle);

        var baseLine1 = new Line(vec2(-hw, 0), vec2(hw, 0), {
            color: '#aaa'
        });
        scene.add(baseLine1);

        var baseLine2 = new Line(vec2(0, hh), vec2(0, -hh), {
            color: '#aaa'
        });
        scene.add(baseLine2);
        
        //レンダリングループ
        (function loop() {
            requestAnimationFrame(loop);
            ctx.clearRect(0, 0, w, h);
            renderer.render(scene);
        }());


        //マウスの位置が三角形内にあるかチェック
        {
            cv.addEventListener('mousemove', function (e) {

                var v0 = triangle.vertices[0];
                var v1 = triangle.vertices[1];
                var v2 = triangle.vertices[2];
                var pos = convertPoint(e.pageX, e.pageY);

                var edge0 = vec2.sub(v1, v0);
                var edge1 = vec2.sub(v2, v1);
                var edge2 = vec2.sub(v0, v2);

                var ce0 = vec2.sub(v1, v0);
                var ce1 = vec2.sub(v2, v0);
                var CCW = 1;

                if (vec2.cross(ce0, ce1) < 0) {
                    CCW = -1;
                }

                var cp0 = vec2.sub(pos, v0);
                
                if (vec2.cross(edge0, cp0) * CCW < 0) {
                    triangle.setColor('#c00');
                    return false;
                }

                var cp1 = vec2.sub(pos, v1);
                
                if (vec2.cross(edge1, cp1) * CCW < 0) {
                    triangle.setColor('#c00');
                    return false;
                }

                var cp2 = vec2.sub(pos, v2);
                
                if (vec2.cross(edge2, cp2) * CCW < 0) {
                    triangle.setColor('#c00');
                    return false;
                }

                triangle.setColor('blue');
            }, false);
        }
    }, false);
}());