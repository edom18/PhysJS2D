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

        var v1 = vec2(-200.0, 210.5);
        var v2 = vec2( 115.0, 310.0);
        var v3 = vec2( 150.0, 115.5);

        var v4 = vec2(  5.0, 100.5);
        var v5 = vec2(295.0, 155.5);
        var v6 = vec2(170.0,  30.0);

        var triangle1 = new Phys2D.Triangle(v1, v2, v3, {
            color: 'red',
            mass: 5
        });
        triangle1.translate(vec2(70, -300));
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
                dragging = false;

                // var contact = new Phys2D.Contact(triangle1, triangle2, {
                //     renderer: renderer,
                //     scene: scene,
                //     contact: function () {
                //         triangle1.setColor('gray');
                //     },
                //     nocontact: function () {
                //         triangle1.setColor('red');
                //     }
                // });
            }, false)

            document.addEventListener('mousemove', function (e) {
                if (!dragging) {
                    return;
                }
                prevX = e.pageX - prevX;
                prevY = e.pageY - prevY;

                triangle1.translate(vec2(prevX, -prevY));
                var contact = new Phys2D.Contact(triangle1, triangle2, {
                    renderer: renderer,
                    scene: scene,
                    contact: function () {
                        triangle1.setColor('gray');
                    },
                    nocontact: function () {
                        triangle1.setColor('red');
                    }
                });

                prevX = e.pageX;
                prevY = e.pageY;
            }, false)
        }
    }, false);
}());
