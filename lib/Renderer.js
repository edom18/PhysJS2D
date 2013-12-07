(function (ns) {

    'use strict';

    /**
     * Renderer
     * @class
     */
    var Renderer = Class.extend({
        init: function (cv) {
            this._cv  = cv;
            this._ctx = cv.getContext('2d');
            this._center = {
                x: cv.width / 2,
                y: cv.height / 2
            };
        },
        render: function (scene) {
            var ctx = this._ctx;
            var center = this._center;

            for (var i = 0, l = scene.length(); i < l; i++) {
                scene.objects[i].draw(ctx, center);
            }
        }
    });

    /*! -----------------------------------------------------
        EXPORTS
    --------------------------------------------------------- */
    ns.Renderer = Renderer;

}(Phys2D));
