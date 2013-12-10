(function (ns) {

    /**
     * コライダクラス
     * @class
     */
    var Collider = Class.extend({
        $class: 'Collider',
        init: function (v1, v2, v3) {
            this.vertices = [v1, v2, v3];
        },

        getVerticesByMatrix: function (matrix) {
            var vertices = this.vertices;
            var ret = [];

            for (var i = 0, l = vertices.length; i < l; i++) {
                ret.push(vec2.applyMatrix3(vertices[i], matrix));
            }

            return ret;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Collider = Collider;
 
}(Phys2D));
