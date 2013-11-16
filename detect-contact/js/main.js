(function () {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight,
        hw = w / 2,
        hh = h / 2;

    var cv, ctx;

    document.addEventListener('DOMContentLoaded', function () {
        cv = document.querySelector('#cv');
        cv.width  = w;
        cv.height = h;
        ctx = cv.getContext('2d');

        var dragging = false;
        var startPos = vec2(0);
        var endPos   = vec2(0);
        var currentPos = vec2(0);

        var scene = new Phys2D.Scene();
        var renderer = new Phys2D.Renderer(cv);

        var originPos = vec2(0.0);
        var origin = new Phys2D.Point(originPos);
        scene.add(origin);

        var v1 = vec2(360.0, 150.0);
        var v2 = vec2(105.0, 220.5);
        var v3 = vec2(295.0, 305.5);

        var v4 = vec2(  5.0, 100.5);
        var v5 = vec2(295.0, 155.5);
        var v6 = vec2(170.0,  30.0);

        var triangle1 = new Phys2D.Triangle(v1, v2, v3, {
            color: 'red',
            mass: 5
        });
        triangle1.translate(vec2(-350, -350));
        scene.add(triangle1);

        var triangle2 = new Phys2D.Triangle(v4, v5, v6, {
            color: 'blue',
            mass: 5,
            useCenter: true
        });
        scene.add(triangle2);

        var baseLine1 = new Phys2D.Line(vec2(-hw, 0), vec2(hw, 0), {
            color: '#aaa'
        });
        scene.add(baseLine1);

        var baseLine2 = new Phys2D.Line(vec2(0, hh), vec2(0, -hh), {
            color: '#aaa'
        });
        scene.add(baseLine2);

        
        //レンダリングループ
        (function loop() {
            requestAnimationFrame(loop);
            ctx.clearRect(0, 0, w, h);
            renderer.render(scene);
        }());

        var Contact = Class.extend({
            init: function (objA, objB) {
                this._objA = objA;
                this._objB = objB;
                this._foundPoints = [];

                this._detect();
            },
            _support: function (supportVec, vertices) {

                var dot = -Number.MAX_VALUE;
                var ful = null;

                for (var i = 0, l = vertices.length; i < l; i++) {
                    var temp = vec2.dot(supportVec, vertices[i]);
                    if (dot < temp) {
                        dot = temp;
                        ful = vertices[i];
                    }
                }

                return vec2(ful);
            },

            _isContact: function () {

                var v0 = this._foundPoints[0];
                var v1 = this._foundPoints[1];
                var v2 = this._foundPoints[2];

                var edge0 = vec2.sub(v1, v0);
                var edge1 = vec2.sub(v2, v1);
                var edge2 = vec2.sub(v0, v2);

                var ce0 = vec2.sub(v1, v0);
                var ce1 = vec2.sub(v2, v0);
                var CCW = 1;

                if (vec2.cross(ce0, ce1) < 0) {
                    CCW = -1;
                }

                var cp0 = vec2.sub(originPos, v0);
                
                if (vec2.cross(edge0, cp0) * CCW < 0) {
                    return false;
                }

                var cp1 = vec2.sub(originPos, v1);
                
                if (vec2.cross(edge1, cp1) * CCW < 0) {
                    return false;
                }

                var cp2 = vec2.sub(originPos, v2);
                
                if (vec2.cross(edge2, cp2) * CCW < 0) {
                    return false;
                }

                return true;
            },

            _checkCenterInTriangle: function () {

                var objAVert = this._objA.getVertices();
                var objBVert = this._objB.getVertices();
                var points   = this._foundPoints;
                var len = points.length;
                var supportA, supportB,
                    ful, fulA, fulB;

                //三角形内に原点があった場合は衝突している
                if (this._isContact()) {
                    return true;
                }

                //ひとつ前の点から最新の点への線分への最近接点を求める
                var nearPoint = Phys2D.detectPointOnLine(this._foundPoints[0], this._foundPoints[1], originPos);

                //求まった点と原点を結んだベクトルのサポート写像を求める
                supportA = vec2.sub(originPos, nearPoint);
                vec2.normalize(supportA);
                supportB = vec2.minus(supportA);

                fulA = this._support(supportA, objAVert);
                fulB = this._support(supportB, objBVert);

                //支点
                ful = vec2.sub(fulA, fulB);

                //三角形の中に原点が見つからず、
                //かつ検出できる支点がなくなった場合は衝突していない
                if (vec2.equal(ful, this._foundPoints[0])) {
                    return false;
                }

                this._foundPoints.unshift(ful);

                //見つかった点を3点までに制限する
                this._slicePoints();

                return this._checkCenterInTriangle();
            },

            /**
             * 求まった点の中で、原点から一番遠い点を除外
             */
            _slicePoints: function () {

                var points = this._foundPoints;
                var distance = 0,
                    point;

                for (var i = 0, l = points.length; i < l; i++) {
                    var len = vec2.norm(points[i]);
                    if (distance < len) {
                        distance = len;
                        point = points[i];
                    }
                }

                var index = points.indexOf(point);
                points.splice(index, 1);
            },

            _detect: function () {

                var objAVert = this._objA.getVertices();
                var objBVert = this._objB.getVertices();
                var supportA, supportB,
                    fulA, fulB;

                //objAの中心点から原点のベクトルによる支点を求める
                supportA = vec2.sub(originPos, this._objA.getCenter());

                //中心から原点へのベクトルを視覚化
                // var line = new Phys2D.Line(originPos, this._objA.getCenter(), {
                //     color: '#fff'
                // });
                // scene.add(line);

                //ベクトルを正規化
                supportA = vec2.normalize(supportA);

                //objB用に反転したベクトルを生成
                supportB = vec2.minus(supportA);

                //objAの支点を求める
                fulA = this._support(supportA, objAVert);

                // var pointA = new Phys2D.Point(vec2(fulA), {
                //     color: 'green'
                // });
                // scene.add(pointA);

                //objBの支点を求める
                fulB = this._support(supportB, objBVert);

                // var pointB = new Phys2D.Point(vec2(fulB), {
                //     color: 'green'
                // });
                // scene.add(pointB);

                //支点1
                //求めたA,Bのサポート写像を合成し、ミンコフスキ差としての支点を求める
                var ful = vec2.sub(fulA, fulB);
                this._foundPoints.unshift(ful);

                // var pointC = new Phys2D.Point(vec2(ful), {
                //    color: 'green'
                // });
                // scene.add(pointC);

                //求まった点と原点を結んだベクトルのサポート写像を求める
                supportA = vec2.sub(originPos, ful);
                supportA = vec2.normalize(supportA);
                supportB = vec2.minus(supportA);

                fulA = this._support(supportA, objAVert);
                fulB = this._support(supportB, objBVert);

                //支点2
                ful = vec2.sub(fulA, fulB);
                this._foundPoints.unshift(ful);

                // var pointD = new Phys2D.Point(vec2(ful), {
                //    color: 'green'
                // });
                // scene.add(pointD);

                //求まった2つの点で作られる線分の最接近点を求める
                var nearPoint = Phys2D.detectPointOnLine(this._foundPoints[1], this._foundPoints[0], originPos);

                // var pointE = new Phys2D.Point(vec2(nearPoint), {
                //     color: 'green'
                // });
                // scene.add(pointE);

                //求まった点と原点を結んだベクトルのサポート写像を求める
                supportA = vec2.sub(originPos, nearPoint);
                vec2.normalize(supportA);
                supportB = vec2.minus(supportA);

                fulA = this._support(supportA, objAVert);
                fulB = this._support(supportB, objBVert);

                //支点3
                ful = vec2.sub(fulA, fulB);
                this._foundPoints.unshift(ful);

                if (this._checkCenterInTriangle()) {
                    triangle1.setColor('gray');
                }
                else {
                    triangle1.setColor('#c00');
                }
            }
        });


        //衝突判定
        {
            cv.addEventListener('click', function (e) {
                var contact = new Contact(triangle1, triangle2);
            });

            var prevX = 0;
            var prevY = 0;
            var dragging = false;

            cv.addEventListener('mousedown', function (e) {
                prevX = e.pageX;
                prevY = e.pageY;
                dragging = true;
            }, false)

            document.addEventListener('mouseup', function (e) {
                dragging = false;
            }, false)

            document.addEventListener('mousemove', function (e) {
                if (!dragging) {
                    return;
                }
                prevX = e.pageX - prevX;
                prevY = e.pageY - prevY;

                triangle1.translate(vec2(prevX, -prevY));
                var contact = new Contact(triangle1, triangle2);

                prevX = e.pageX;
                prevY = e.pageY;
            }, false)
        }
    }, false);
}());
