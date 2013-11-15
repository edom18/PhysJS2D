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

        var v1 = vec2(  5.0,   10.0);
        var v2 = vec2(-150.0, 120.5);
        var v3 = vec2( 140.0, 205.5);

        var v4 = vec2(-150.0, 100.5);
        var v5 = vec2( 140.0, 155.5);
        var v6 = vec2(  15.0,  30.0);

        var triangle1 = new Phys2D.Triangle(v1, v2, v3, {
            color: 'red',
            mass: 5
        });
        triangle1.translate(vec2(100, 100));
        scene.add(triangle1);

        var triangle2 = new Phys2D.Triangle(v4, v5, v6, {
            color: 'blue',
            mass: 5
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


        //ドラッグでラインを引く処理。
        {
            cv.addEventListener('mousedown', function (e) {
                dragging = true;
                startPos = Phys2D.convertPoint(e.pageX, e.pageY);
                currentPos = vec2(startPos);
            }, false);

            document.addEventListener('mousemove', function (e) {
                if (!dragging) {
                    return;
                }

                currentPos = Phys2D.convertPoint(e.pageX, e.pageY);
            }, false);

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

                //var line2 = new Line(originPos, detectVec, {
                var line2 = new Phys2D.Line(e0, e1, {
                    color: '#1191fa'
                });
                scene.add(line2);
                lines.push(line2);

                //内積を取るようのベクトルを算出
                var _detectVec = vec2(detectVec);
                vec2.normalize(_detectVec);

                for (var i = 0, l = triangle1.vertices.length; i < l; i++) {
                    var dot = vec2.dot(_detectVec, triangle1.vertices[i]);
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
