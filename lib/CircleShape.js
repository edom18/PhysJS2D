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
            return mass * this.radius * this.radius * 0.5;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.CircleShape = CircleShape;
 
}(Phys2D));
