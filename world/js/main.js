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
        
        var redShape = new Phys2D.BoxShape(2, 2);
        var redBody = new Phys2D.RigidBody(20, redShape, {
            // angularVelocity: 500,
            color: 'red'
        });
        redBody.translate(vec2(0.5, 5));
        scene.add(redBody);

        var v1 = vec2(-15.0,   5.0);
        var v2 = vec2( 15.0,   5.0);
        var v3 = vec2(  0.0, -15.0);
        
        var blueShape = new Phys2D.TriangleShape(v1, v2, v3);
        var blueBody = new Phys2D.RigidBody(0, blueShape, {
            color: 'blue'
        });
        // blueBody.scale(vec2(0.1));
        // blueBody.translate(vec2(0, -6.65));
        blueBody.translate(vec2(0, -8.5));
        scene.add(blueBody);

        var greenShape = new Phys2D.CircleShape(0.5, 0.5);
        var greenBody = new Phys2D.RigidBody(5, greenShape, {
            restitution: 1,
            color: 'green'
        });
        greenBody.translate(vec2(-1, 0));
        scene.add(greenBody);

        var grayShape = new Phys2D.CircleShape(0.3, 0.3);
        var grayBody = new Phys2D.RigidBody(5, grayShape, {
            color: 'gray'
        });
        grayBody.translate(vec2(-1, 1));
        scene.add(grayBody);

        var v4 = vec2(-1.0, 2.5);
        var v5 = vec2(  0.0,  3.0);
        var v6 = vec2( 1.0, 2.5);
        
        var yellowShape = new Phys2D.TriangleShape(v4, v5, v6);
        var yellowBody = new Phys2D.RigidBody(5, yellowShape, {
            color: 'yellow'
        });
        yellowBody.translate(vec2(0.0, 2));
        scene.add(yellowBody);

        var gravity = vec2(0, -9.8);
        var world = new Phys2D.World(gravity);
        world.add(redBody);
        world.add(blueBody);
        world.add(greenBody);
        world.add(grayBody);
        world.add(yellowBody);

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
        loop();
        // document.addEventListener('click', loop, false);
        
    }, false);
}());
