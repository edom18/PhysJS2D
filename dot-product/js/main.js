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

        var mass = 100;
        var v1 = vec2(  5.0,   10.0);
        var v2 = vec2(-150.0, 120.5);
        var v3 = vec2( 140.0, 205.5);
        var triangle = new Phys2D.Triangle(v1, v2, v3, {
            color: 'red',
            mass: 100
        });
        scene.add(triangle);

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
            drawLine(startPos, currentPos);
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
                _detectVec = vec2.normalize(_detectVec);

                for (var i = 0, l = triangle.vertices.length; i < l; i++) {
                    var dot = vec2.dot(_detectVec, triangle.vertices[i]);
                    var vec = vec2.multiplyScalar(_detectVec, dot);
                    var dp = new Phys2D.Point(vec, {
                        color: 'green'
                    });
                    scene.add(dp);
                    points.push(dp);
                }

            }, false);
        }

        //ドラッグ中のラインを引く
        function drawLine(start, end) {
            ctx.save();
            ctx.strokeStyle = 'fa1131';
            ctx.beginPath();
            ctx.translate(hw, hh);
            ctx.moveTo(start.x, -start.y);
            ctx.lineTo(end.x, -end.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
        
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
    }, false);
}());
