(function (ns) {

    var DEBUG = true;
    var CONTACT_THRESHOLD_NORMAL = ns.CONTACT_THRESHOLD_NORMAL;	// 衝突点の閾値（法線方向）

    /**
     * 接触点を表すクラス
     * @class
     * @param {vec2} depthPoint 貫通深度のベクトル
     * @param {vec2} contactPoint 接触点の座標
     * @param {vec2} pointA 剛体Aのローカル座標
     * @param {vec2} pointB 剛体Bのローカル座標
     */
    var ContactPoint = Class.extend({
        init: function (depthPoint, contactPoint, pointA, pointB) {
            this.depthPoint = depthPoint;
            this.contactPoint = contactPoint;
            this.pointA = pointA;
            this.pointB = pointB;
            this.distance = vec2.norm(depthPoint);
            this.constraints = [
                new ns.Constraint(),
                new ns.Constraint()
            ];
        },

        /**
         * @param {mat3} matrixA
         * @param {mat3} matrixB
         */
        refresh: function (matrixA, matrixB) {

            var normal = vec2.minus(vec2.normalize(this.depthPoint));
            // var normal = vec2.normalize(this.depthPoint);
            var cpA = vec2.applyMatrix3(this.pointA, matrixA);
            var cpB = vec2.applyMatrix3(this.pointB, matrixB);

            // 貫通深度がプラスに転じたかどうかをチェック
            var delta = vec2.sub(cpA, cpB);
            if (vec2.dot(normal, delta) > CONTACT_THRESHOLD_NORMAL) {
                // debugger;
                return null;
            }
        }
    });


    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.ContactPoint = ContactPoint;
 
}(Phys2D));
