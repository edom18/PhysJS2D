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

        var scene = new Phys2D.Scene();
        var renderer = new Phys2D.Renderer(cv);

        //for debug.
        window.scene = scene;
        window.renderer = renderer;

        var v1 = vec2(-100.0, 200.5);
        var v2 = vec2(  0.0,  300.0);
        var v3 = vec2( 100.0, 200.5);

        var v4 = vec2(-1005.0, 50.5);
        var v5 = vec2(1005.0, 50.5);
        var v6 = vec2( 80.0, -205.0);

        var v7 = vec2(-55.0, 50.5);
        var v8 = vec2(  0.0, 75.5);
        var v9 = vec2( 25.0, 15.0);

        var triangle1 = new Phys2D.Triangle(v1, v2, v3, {
            angularVelocity: -1.0573645251177235,
            acceleration: vec2(0, -0.03),
            velocity: vec2(-0.0000014793560012549278, -0.25182345509529114),
            color: 'red',
            mass: 100
        });
        triangle1.scale(vec2(0.5));
        triangle1.rotate(-15);
        triangle1.translate(vec2(-1.0001170635223389, -127.42633819580078));
        // window.t = triangle1;
        scene.add(triangle1);

        var triangle2 = new Phys2D.Triangle(v4, v5, v6, {
            // angularVelocity: 0.1,
            color: 'blue',
            mass: 0
        });
        triangle2.translate(vec2(0, -180));
        triangle2.scale(vec2(0.32));
        scene.add(triangle2);

        var triangle3 = new Phys2D.Triangle(v7, v8, v9, {
            angularVelocity: 0.2,
            acceleration: vec2(0, -0.03),
            color: 'green',
            mass: 20
        });
        // triangle3.scale(vec2(2, 2));
        triangle3.translate(vec2(0, 200));
        // scene.add(triangle3);

        var triangle4 = new Phys2D.Triangle(v7, v8, v9, {
            // angularVelocity: 0.3,
            // acceleration: vec2(0, -0.03),
            color: 'yellow',
            mass: 0
        });
        triangle4.translate(vec2(-200, 300));
        triangle4.rotate(55);
        triangle4.scale(vec2(8));
        // scene.add(triangle4);

        var world = new Phys2D.World();
        world.add(triangle1);
        world.add(triangle2);
        // world.add(triangle3);
        // world.add(triangle4);

        //直交座標系のラインを引く
        var baseLine1 = new Phys2D.Line(vec2(-hw, 0), vec2(hw, 0), {
            color: '#aaa'
        });
        scene.add(baseLine1);

        var baseLine2 = new Phys2D.Line(vec2(0, hh), vec2(0, -hh), {
            color: '#aaa'
        });
        scene.add(baseLine2);
        
        //レンダリングループ
        var prevTime = +new Date();
        function loop() {
            var now = +new Date();
            requestAnimationFrame(loop);
            ctx.clearRect(0, 0, w, h);
            renderer.render(scene);
            // world.step(now - prevTime);

            prevTime = now;
            // setTimeout(loop, 16);
        }

        loop();

        //衝突判定
        {
            var prevX = 0;
            var prevY = 0;
            var dragging = false;

            cv.addEventListener('mousedown', function (e) {
                prevX = e.pageX;
                prevY = e.pageY;
                dragging = true;
            }, false)

            document.addEventListener('mouseup', function (e) {
                world.step(16);
            }, false)

            document.addEventListener('mousemove', function (e) {
                if (!dragging) {
                    return;
                }
                prevX = e.pageX - prevX;
                prevY = e.pageY - prevY;

                triangle1.translate(vec2(prevX, -prevY));

                prevX = e.pageX;
                prevY = e.pageY;
            }, false)
        }
    }, false);
}());
