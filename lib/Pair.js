(function (ns) {

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
            this.typeNew = true;
            this.accumImpulse = 0.0;
            this.friction     = 0.0;

            //検出された衝突点の情報
            this.contacts = [];
        },

        /**
         * 検出された衝突点を追加する
         * @param {Phys2D.ContactPoint}
         */
        addContactPoint: function (cp) {

            var contacts = this.contacts;
            contacts.push(cp);

            var temp = -Number.MAX_VALUE;
            var resultPoint = null;
            var result = [];
            if (contacts.length > ns.contactsLimit) {

                for (var i = 0, l = contacts.length; i < l; i++) {
                    var depth = vec2.lengthSqr(contacts[i].depthPoint);
                    if (temp < depth) {
                        temp = depth;
                        resultPoint = contacts[i];
                    }
                }

                result.push(resultPoint);
                for (var i = 0, l = contacts.length; i < l; i++) {
                    if (contacts[i] === resultPoint) {
                        continue;
                    }

                    result.push(contacts[i]);

                    if (result.length === ns.contactsLimit) {
                        break;
                    }
                }

                this.contacts = result;
            }
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Pair = Pair;
 
}(Phys2D));
