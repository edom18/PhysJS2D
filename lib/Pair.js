(function (ns) {

    var CONTACT_SAME_POINT = ns.CONTACT_SAME_POINT;

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
            this.friction = 0.0;

            //検出された衝突点の情報
            this.contacts = [];
        },

        /**
         * 追加される点に近い点があるか探す
         * あればその点のIDを返し、なければ-1を返す。
         *
         * @param {vec2} newPointA 新規衝突点の剛体Aの座標
         * @param {vec2} newPointB 新規衝突点の剛体Bの座標
         * @param {vec2} newNormal 衝突法線ベクトル
         * @return {number}
         */
        findNearestContactPoint: function (newPointA, newPointB, newNormal) {

            var nearestIdx = -1;
            var minDiff = CONTACT_SAME_POINT;

            for (var i = 0, l = this.contacts.length; i < l; i++) {
                var contact = this.contacts[i];
                var diffA = vec2.norm(vec2.sub(contact.pointA, newPointA));
                var diffB = vec2.norm(vec2.sub(contact.pointB, newPointB));

                if (diffA < minDiff && diffB < minDiff && vec2.dot(newNormal, vec2.normalize(contact.depthPoint)) > 0.99) {
                    minDiff = Math.max(diffA, diffB);
                    nearestIdx = i;
                }
            }

            return nearestIdx;
        },

        /**
         * 検出された衝突点を追加する
         * @param {Phys2D.ContactPoint} cp
         */
        addContactPoint: function (cp) {

            var contactsLimit = ns.contactsLimit;
            var contacts = this.contacts;
            var id = this.findNearestContactPoint(cp.pointA, cp.pointB, vec2.normalize(cp.depthPoint));

            //既存の点と比較して近い点があった場合は点を更新
            if (id >= 0) {

                // debugger;
                var newNormal = vec2.normalize(cp.depthPoint);
                var normal = vec2.normalize(contacts[id].depthPoint);

                if (Math.abs(vec2.dot(newNormal, normal)) > 0.99) {
                	// 同一点を発見、蓄積された情報を引き継ぐ
                	contacts[id].distance = cp.distance;
                	contacts[id].contactPoint = cp.contactPoint;
                	contacts[id].depthPoint = cp.depthPoint;
                	contacts[id].pointA = cp.pointA;
                	contacts[id].pointB = cp.pointB;
                	// contacts[id].normal = cp.normal;
                }
                else {
                	// 同一点ではあるが法線が違うため更新
                	contacts[id] = cp;
                }

                return;
            }
            //近い点がなく、かつ保持最大数を下回っている場合は
            //衝突点を新規追加して終了
            else if (id < 0 && contacts.length < contactsLimit) {
                contacts.push(cp);
                return;
            }

            // debugger;
            //新規衝突点があり、かつ最大保持数を超えていた場合は
            //深い衝突点を残しつつ、それと一番近い点を削除
            contacts.push(cp);
            var temp = -Number.MAX_VALUE;
            var resultPoint = null;

            if (contacts.length > ns.contactsLimit) {

                // var mostDepthId = -1;

                //一番深度の深い点を検索
                for (var i = 0, l = contacts.length; i < l; i++) {
                    var depth = contacts[i].distance;
                    if (temp < depth) {
                        temp = depth;
                        resultPoint = contacts[i];
                        // mostDepthId = i;
                    }
                }

                // var dist1 = 0,
                //     dist2 = 0;
                // if (mostDepthId !== 0) {
                //      dist1 = vec2.norm(vec2.sub(cp.contactPoint, contacts[i].contactPoint));
                // }
                // if (mostDepthId !== 1) {

                // }
                // if (mostDepthId !== 2) {

                // }

                var minDist = Number.MAX_VALUE;
                var minId   = -1;
                var dist    = 0;

                for (var i = 0, l = contacts.length; i < l; i++) {
                    if (contacts[i] === resultPoint) {
                        continue;
                    }

                    dist = vec2.norm(vec2.sub(resultPoint.contactPoint, contacts[i].contactPoint));

                    if (minDist > dist) {
                        minDist = dist;
                        minId = i;
                    }
                }

                contacts.splice(minId, 1);
            }
        },

        refreshContactPoint: function () {
            var contacts = this.contacts;
            var result = [];

            for (var i = 0, l = contacts.length; i < l; i++) {
                if (contacts[i].refresh(this.objA.matrix, this.objB.matrix) === null) {
                    continue;
                }
                result.push(contacts[i]);
            }

            this.contacts = result;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Pair = Pair;
 
}(Phys2D));
