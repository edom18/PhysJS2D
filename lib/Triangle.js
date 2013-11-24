(function (ns) {

    'use strict';

    /**
     * 三角形クラス
     *
     * @class
     * @param {vec2} v1
     * @param {vec2} v2
     * @param {vec2} v3
     * @param {number} mass
     */
    var Triangle = ns.Object2D.extend({
        init: function (v1, v2, v3, opt) {
            opt || (opt = {});

            this._super();

            this.inertia = 0;
            this.angle   = 0;
            this.angularAcc      = opt.angularAcc || 0;
            this.angularVelocity = opt.angularVelocity || 0;
            this.velocity        = opt.velocity || vec2(0.0);
            this.acceleration    = opt.acceleration || vec2(0.0);
            this.mass    = opt.mass == null ? 1 : opt.mass;
            this._color  = opt.color || 'black';
            this.restitution = opt.restitution || 0.1;
            this._originalVertices = [vec2(v1), vec2(v2), vec2(v3)];
            this.vertices = [v1, v2, v3];
            this.calcInertia();

            //頂点から重心位置を求め、重心を原点に合わせる
            this._calcCenter();
            var tmat = mat3.translate(vec2.minus(this._center));
            this.vertices[0] = vec2.applyMatrix3(this.vertices[0], tmat);
            this.vertices[1] = vec2.applyMatrix3(this.vertices[1], tmat);
            this.vertices[2] = vec2.applyMatrix3(this.vertices[2], tmat);

            //移動後、改めて重心座標を更新
            this._calcCenter();
        },

        /**
         * 重心を求める
         * CoG = 1 / 3(v1 + v2 + v3);
         */
        _calcCenter: function () {

            var model = this.matrix;
            var v0 = this.vertices[0];
            var v1 = this.vertices[1];
            var v2 = this.vertices[2];

            var center = vec2.add(v0, v1);
            center = vec2.add(center, v2);
            center = vec2.multiplyScalar(center, 1 / 3);

            this._center = center;
        },

        /**
         * @return {vec2}
         */
        getCenter: function () {
            return vec2.applyMatrix3(this._center, this.matrix);
        },
        
        /**
         * 重心の慣性テンソルを計算
         * 
         * I = 1/18m(|v_1|^2 + |v_2|^2 + |v_3|^2 - v_2・v_3 - v_3・v_1 - v_1・v_2)
         *
         */
        calcInertia: function () {
            var v1 = this.vertices[0];
            var v2 = this.vertices[1];
            var v3 = this.vertices[2];
            
            var v1len = vec2.lengthSqr(v1);
            var v2len = vec2.lengthSqr(v2);
            var v3len = vec2.lengthSqr(v3);
            var v2v3 = vec2.dot(v2, v3);
            var v3v1 = vec2.dot(v3, v1);
            var v1v2 = vec2.dot(v1, v2);

            var I = (1 / 18) * this.mass * (v1len + v2len + v3len - v2v3 - v3v1 - v1v2);

            this.inertia = I;
        },

        /**
         * 設定をリセットする
         */
        reset: function () {
            this.angularVelocity = 0;
            this.angle = 0;
            this.angularAcc = 0;
            this.calcInertia();
        },

        /**
         * レンダリング
         */
        draw: function (ctx, center) {

            var model = this.matrix;

            var vertices = this.vertices;
            var v0 = vec2.applyMatrix3(vertices[0], model);
            var v1 = vec2.applyMatrix3(vertices[1], model);
            var v2 = vec2.applyMatrix3(vertices[2], model);

            ctx.save();
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.moveTo(v0.x, -v0.y);
            ctx.lineTo(v1.x, -v1.y);
            ctx.lineTo(v2.x, -v2.y);
            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        },

        /**
         * 座標位置をアップデート
         */
        update: function () {

            //回転の更新
            this.angularVelocity += this.angularAcc;
            this.rotate(this.angularVelocity);

            //速度の更新
            this.velocity = vec2.add(this.velocity, this.acceleration);
            this.translate(this.velocity);
        }
    });


    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    ns.Triangle = Triangle;

}(Phys2D));
