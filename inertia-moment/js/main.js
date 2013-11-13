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

        var massInp = document.querySelector('#mass');
        massInp.addEventListener('change', function (e) {
            triangle.mass = +this.value;
            triangle.reset();
        }, false);

        var mass = +massInp.value;

        var v1 = vec2(-10, -10);
        var v2 = vec2(30, 100);
        var v3 = vec2(100, 20);

        //三角形をひとつ作る
        var triangle = new Triangle(v1, v2, v3, {
            mass: mass,
            color: '#c00',
            useCenter: true
        });

        scene.add(triangle);

        var dragging = false;
        var startPos = vec2(0);
        var endPos   = vec2(0);
        var currentPos = vec2(0);


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
            drawLine(startPos, currentPos);
            renderer.render(scene);
        }());


        //ドラッグでラインを引く処理。
        {
            cv.addEventListener('mousedown', function (e) {
                dragging = true;
                startPos = convertPoint(e.pageX, e.pageY);
                currentPos = vec2(startPos);
            }, false);

            document.addEventListener('mousemove', function (e) {
                if (!dragging) {
                    return;
                }

                currentPos = convertPoint(e.pageX, e.pageY);
            }, false);

            document.addEventListener('mouseup', function (e) {
                if (!dragging) {
                    return;
                }
                dragging = false;
                endPos = convertPoint(e.pageX, e.pageY);

                var f = vec2.sub(endPos, startPos);
                var r = startPos;

                var t = vec2.cross(r, f);
                var a = t / triangle.inertia;

                triangle.angularAcc += a;
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
