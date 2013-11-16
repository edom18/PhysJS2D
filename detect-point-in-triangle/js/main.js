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

        var scene = new Phys2D.Scene();
        var renderer = new Phys2D.Renderer(cv);

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
        var triangle = new Phys2D.Triangle(v1, v2, v3, {
            mass: 5,
            color: '#c00'
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
