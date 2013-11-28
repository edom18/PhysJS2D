(function (ns) {

    /**
     * 拘束を表すクラス
     * @class
     * @param {Phys2D.ContactPoint} cp
     */
    var Constraint = Class.extend({
        init: function (cp) {
        },

        reset: function () {
            this.axis = vec2.right;
            this.rhs = 0.0;
            this.accumImpulse = 0.0;
            this.lowerLimit = 0.0;
            this.upperLimit = 0.0;
        },

        /** @type {vec2} */
        axis: null,

        /** @type {number} */
        rhs : 0.0,

        /** @type {number} */
        accumImpulse: 0.0,

        /** @type {number} */
        lowerLimit: 0.0,

        /** @type {number} */
        upperLimit: 0.0
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Constraint = Constraint;
 
}(Phys2D));
