(function (ns) {

    /**
     * 拘束を表すクラス
     * @class
     * @param {Phys2D.ContactPoint} cp
     */
    var Constraint = Class.extend({
        init: function (cp) {
            this.accumImpulse = 0.0;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Constraint = Constraint;
 
}(Phys2D));
