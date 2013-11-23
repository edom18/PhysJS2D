(function (ns) {

    'use strict';

    /**
     * Line class
     * @class
     */
    var Line = ns.Object2D.extend({
        init: function (start, end, opt) {

            opt || (opt = {});

            this._start = start;
            this._end = end;
            this._color = opt.color || 'black';
        },
        draw: function (ctx, center) {
            ctx.save();
            ctx.strokeStyle = this._color;
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.moveTo(this._start.x, -this._start.y);
            ctx.lineTo(this._end.x, -this._end.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    });

    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    ns.Line = Line;

}(Phys2D));
