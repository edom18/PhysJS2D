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

        var v1 = vec2(-1.0, 2.5);
        var v2 = vec2(  0.0,  3.0);
        var v3 = vec2( 1.0, 2.5);

        var v4 = vec2(-150.0,   50.0);
        var v5 = vec2( 150.0,   50.0);
        var v6 = vec2(   0.0, -150.0);

        var v7 = vec2(-1.5, 1.55);
        var v8 = vec2(  0.0, 2.155);
        var v9 = vec2( 0.65, 0.45);

        var triangle1 = new Phys2D.Triangle(v1, v2, v3, {
            angularVelocity: -1,
            acceleration: vec2(0, -9.8),
            // velocity: vec2(0, -10),
            color: 'red',
            mass: 100
        });
        triangle1.translate(vec2(0, 10));
        // triangle1.scale(vec2(0.5));
        // triangle1.rotate(-1);
        // window.t = triangle1;
        // scene.add(triangle1);

        var triangle2 = new Phys2D.Triangle(v4, v5, v6, {
            // angularVelocity: 0.1,
            color: 'blue',
            mass: 0
        });
        triangle2.translate(vec2(0, -70));
        // triangle2.scale(vec2(0.32));
        // scene.add(triangle2);

        var triangle3 = new Phys2D.Triangle(v7, v8, v9, {
            angularVelocity: 50,
            acceleration: vec2(0, -9.8),
            color: 'green',
            mass: 20
        });
        triangle3.scale(vec2(0.7));
        triangle3.translate(vec2(0, 20));
        // scene.add(triangle3);

        var triangle4 = new Phys2D.Triangle(v7, v8, v9, {
            angularVelocity: 30,
            acceleration: vec2(0, -9.8),
            color: 'yellow',
            mass: 50
        });
        // triangle4.translate(vec2(-100, 0));
        // triangle4.rotate(55);
        triangle4.scale(vec2(0.1));
        // scene.add(triangle4);
        
        var blueShape = new Phys2D.TriangleShape(v4, v5, v6);
        var blueBody = new Phys2D.RigidBody(0, blueShape, {
            color: 'blue'
        });
        blueBody.scale(vec2(0.1));
        blueBody.translate(vec2(0, -10));
        scene.add(blueBody);

        var greenShape = new Phys2D.TriangleShape(v7, v8, v9);
        var greenBody = new Phys2D.RigidBody(20, greenShape, {
            // angularVelocity: 50,
            acceleration: vec2(0, -9.8),
            color: 'green'
        });
        scene.add(greenBody);

        var world = new Phys2D.World();
        world.add(blueBody);
        world.add(greenBody);
        // world.add(triangle1);
        // world.add(triangle2);
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
        function loop() {
            var timeStep = 0.016;
            requestAnimationFrame(loop);
            ctx.clearRect(0, 0, w, h);
            renderer.render(scene);
            world.step(timeStep);
        }

        // document.addEventListener('click', function () {
            // for (var i = 0; i < 70; i++) {
                loop();
            // }
        // }, false);

        //衝突判定
        // {
        //     var prevX = 0;
        //     var prevY = 0;
        //     var dragging = false;

        //     cv.addEventListener('mousedown', function (e) {
        //         prevX = e.pageX;
        //         prevY = e.pageY;
        //         dragging = true;
        //     }, false)

        //     document.addEventListener('mouseup', function (e) {
        //         dragging = false;
        //     }, false)

        //     document.addEventListener('mousemove', function (e) {
        //         if (!dragging) {
        //             return;
        //         }
        //         prevX = e.pageX - prevX;
        //         prevY = e.pageY - prevY;

        //         triangle1.translate(vec2(prevX, -prevY));

        //         prevX = e.pageX;
        //         prevY = e.pageY;
        //     }, false)
        // }
    }, false);
}());
