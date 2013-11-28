(function (ns) {

    var DEBUG = true;

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
        }
    });


    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.ContactPoint = ContactPoint;
 
}(Phys2D));
