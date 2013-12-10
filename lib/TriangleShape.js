(function (ns) {

    /**
     * TriangleShapeクラス
     * @class
     * @param {vec2} v1
     * @param {vec2} v2
     * @param {vec2} v3
     */
    var TriangleShape = ns.Shape.extend({
        $class: 'TriangleShape',
        init: function (v0, v1, v2) {
            this._super();

            //頂点から重心位置を求める
            var center = this._calcCenter(v0, v1, v2);

            //求めた重心位置を原点に合わせる
            var tmat = mat3.translate(vec2.minus(center));
            this.vertices = [
                vec2.applyMatrix3(v0, tmat),
                vec2.applyMatrix3(v1, tmat),
                vec2.applyMatrix3(v2, tmat)
            ];


            this._createCollider(
                this.vertices[0],
                this.vertices[1],
                this.vertices[2]
            );
        },

        /**
         * 形状にあったコライダを生成する
         * @param {vec2} v1
         * @param {vec2} v2
         * @param {vec2} v3
         */
        _createCollider: function (v1, v2, v3) {
            var collider = new ns.Collider(v1, v2, v3);
            this.colliders.push(collider);
        },

        /**
         * 重心を求める
         * CoG = 1 / 3(v1 + v2 + v3);
         */
        _calcCenter: function (v0, v1, v2) {

            var center = vec2.add(v0, v1);
            center = vec2.add(center, v2);
            center = vec2.multiplyScalar(center, 1 / 3);

            return center;
        },

        /**
         * 重心の慣性テンソルを計算
         * I = 1/18m(|v_1|^2 + |v_2|^2 + |v_3|^2 - v_2・v_3 - v_3・v_1 - v_1・v_2)
         *
         * @param {number} mass 質量
         */
        calcInertia: function (mass) {
            var v1 = this.vertices[0];
            var v2 = this.vertices[1];
            var v3 = this.vertices[2];
            
            var v1len = vec2.lengthSqr(v1);
            var v2len = vec2.lengthSqr(v2);
            var v3len = vec2.lengthSqr(v3);
            var v2v3 = vec2.dot(v2, v3);
            var v3v1 = vec2.dot(v3, v1);
            var v1v2 = vec2.dot(v1, v2);

            return (1 / 18) * mass * (v1len + v2len + v3len - v2v3 - v3v1 - v1v2);
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.TriangleShape = TriangleShape;
 
}(Phys2D));
