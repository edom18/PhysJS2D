(function (ns) {

    /**
     * BoxShapeクラス
     * @class
     * @param {number} width
     * @param {number} height
     */
    var CircleShape = ns.Shape.extend({
        $class: 'CircleShape',
        type: ns.shapeType.circleShapeBit,
        init: function (radius) {
            this._super();

            this.radius  = radius;
            this.halfradius = radius * 0.5;

            this.vertices = [vec2.zero];
        },

        /**
         * 重心の慣性テンソルを計算
         * I = 1/18m(|v_1|^2 + |v_2|^2 + |v_3|^2 - v_2・v_3 - v_3・v_1 - v_1・v_2)
         *
         * @param {number} mass 質量
         */
        calcInertia: function (mass) {
            var result = 0;

            for (var i = 0, l = this.colliders.length; i < l; i++) {
                var vertices = this.colliders[i].vertices;
                var v1 = vertices[0];
                var v2 = vertices[1];
                var v3 = vertices[2];
                
                var v1len = vec2.lengthSqr(v1);
                var v2len = vec2.lengthSqr(v2);
                var v3len = vec2.lengthSqr(v3);
                var v2v3 = vec2.dot(v2, v3);
                var v3v1 = vec2.dot(v3, v1);
                var v1v2 = vec2.dot(v1, v2);

                result += (1 / 18) * mass * (v1len + v2len + v3len - v2v3 - v3v1 - v1v2);
            }

            return result;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.CircleShape = CircleShape;
 
}(Phys2D));
