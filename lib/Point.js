(function (ns) {

    'use strict';

    /**
     * Point class
     * @class
     */
    var Point = ns.Object2D.extend({
        init: function (pos, opt) {

            opt || (opt = {});

            this._pos = pos;
            this._radius = opt.radius || 5;
            this._color = opt.color || 'black';
        },
        draw: function (ctx, center) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.arc(this._pos.x, -this._pos.y, this._radius, Math.PI * 2, false);
            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
    });


    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    ns.Point = Point;

}(Phys2D));
