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
        //triangle1.translate(vec2(100, 100));
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
            _detect: function () {

                var fuls = [];
                var objAVert = this._objA.getVertices();
                var objBVert = this._objB.getVertices();
                var supportA, supportB,
                    fulA, fulB;

                //objAの中心点から原点のベクトルによる支点を求める
                supportA = vec2.sub(originPos, this._objA.getCenter());

                //中心から原点へのベクトルを視覚化
                var line = new Phys2D.Line(originPos, this._objA.getCenter(), {
                    color: '#fff'
                });
                scene.add(line);

                //ベクトルを正規化
                supportA = vec2.normalize(supportA);

                //objB用に反転したベクトルを生成
                supportB = vec2.minus(supportA);

                //objAの支点を求める
                fulA = this._support(supportA, objAVert);

                var pointA = new Phys2D.Point(vec2(fulA), {
                    color: 'green'
                });
                scene.add(pointA);

                //objBの支点を求める
                fulB = this._support(supportB, objBVert);

                var pointB = new Phys2D.Point(vec2(fulB), {
                    color: 'green'
                });
                scene.add(pointB);

                //求めたA,Bのサポート写像を合成し、ミンコフスキ差としての支点を求める
                var ful = vec2.sub(fulA, fulB);
                fuls.push(ful);

                var pointC = new Phys2D.Point(vec2(ful), {
                   color: 'green'
                });
                scene.add(pointC);

                // //求まった点と原点を結んだベクトルのサポート写像を求める
                // supportA = vec2.sub(originPos, ful);
                // vec2.normalize(supportA);
                // supportB = vec2.minus(supportA);

                // fulA = this._support(supportA, objAVert);
                // fulB = this._support(supportB, objBVert);
                // ful = vec2.sub(fulA, fulB);
                // fuls.push(ful);

                // var pointD = new Phys2D.Point(vec2(ful), {
                //    color: 'green'
                // });
                // scene.add(pointD);

                // var nearPoint = Phys2D.detectPointOnLine(fuls[1], fuls[0], originPos);
                // var pointE = new Phys2D.Point(vec2(nearPoint), {
                //     color: 'green'
                // });
                // scene.add(pointE);

                // //求まった点と原点を結んだベクトルのサポート写像を求める
                // supportA = vec2.sub(originPos, nearPoint);
                // vec2.normalize(supportA);
                // supportB = vec2.minus(supportA);

                // fulA = this._support(supportA, objAVert);
                // fulB = this._support(supportB, objBVert);
                // ful = vec2.sub(fulA, fulB);
                // fuls.push(ful);

                // //3点求まったので三角形を作る
                // var tri = new Phys2D.Triangle(fuls[0], fuls[1], fuls[2], {
                //     color: 'green'
                // });

                // scene.add(tri);
            }
        });


        //衝突判定
        {
            cv.addEventListener('click', function (e) {
                var contact = new Contact(triangle1, triangle2);
            });

            var lines = [], points = [];
            document.addEventListener('mouseup', function (e) {

                if (!dragging) {
                    return;
                }

                dragging = false;
                endPos = Phys2D.convertPoint(e.pageX, e.pageY);

                var color = '#666';
                lines.forEach(function (line) {
                    line.setColor(color);
                });
                points.forEach(function (point) {
                    point.setColor(color);
                });

                //引かれたラインと原点との最近接点を検出
                var detectVec = Phys2D.detectPointOnLine(startPos, endPos, originPos);

                //検出された点を作成
                var point = new Phys2D.Point(detectVec, {
                    radius: 3,
                    color: '#fff'
                });
                scene.add(point);
                points.push(point);

                //引かれたラインを残す用
                var line1 = new Phys2D.Line(startPos, endPos, {
                    color: '#fff'
                });
                scene.add(line1);
                lines.push(line1);

                //検出した点を通るライン
                var dx = vec2.sub(detectVec, originPos);
                var delta = dx.y / dx.x;
                var ey = -hw * delta;
                var e0 = vec2(-hw, ey);
                var e1 = vec2(hw, -ey)

                var line2 = new Phys2D.Line(e0, e1, {
                    color: '#1191fa'
                });
                scene.add(line2);
                lines.push(line2);

                //内積を取るようのベクトルを算出
                var _detectVec = vec2(detectVec);
                _detectVec = vec2.normalize(_detectVec);

                var vertices = triangle1.getVertices();
                for (var i = 0, l = vertices.length; i < l; i++) {
                    var dot = vec2.dot(_detectVec, vertices[i]);
                    var vec = vec2.multiplyScalar(_detectVec, dot);
                    var dp = new Phys2D.Point(vec, {
                        color: 'green'
                    });
                    scene.add(dp);
                    points.push(dp);
                }

            }, false);
        }
    }, false);
}());
