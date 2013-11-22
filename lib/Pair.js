(function (ns) {

    //検出点の最大保持数
    var contactsLimit = 2;

    /**
     * 衝突検出された物体のペア情報
     * @class
     * @param {Phys2D.Object2D} objA 検出された物体のペアA
     * @param {Phys2D.Object2D} objB 検出された物体のペアB
     */
    var Pair = Class.extend({
        init: function (objA, objB) {
            this.uuid = objA.id + '-' + objB.id;
            this.objA = objA;
            this.objB = objB;

            //検出された衝突点の情報
            this.contacts = new Array(contactsLimit);
        },

        /**
         * 検出された衝突点を追加する
         * @param {Phys2D.ContactPoint}
         */
        addContactPoint: function (cp) {
            this.contacts[0] = cp;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Pair = Pair;
 
}(Phys2D));
