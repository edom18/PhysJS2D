(function (ns) {

    var Pi2 = Math.PI * 2;

    /**
     *剛体クラス
     * @class
     * @param {number} mass 質量
     * @param {Phys2D.Shape} shape 形状データ
     * @param {Object} opt オプション
     */
    var RigidBody = ns.Object2D.extend({
        $class: 'RigidBody',
        init: function (mass, shape, opt) {

            opt || (opt = {});

            this._super();

            this.mass = mass;
            this._shape = shape;

            this.angle   = 0;
            this.angularAcc      = opt.angularAcc || 0;
            this.angularVelocity = opt.angularVelocity || 0;
            this.velocity        = opt.velocity || vec2(0.0);
            this.acceleration    = opt.acceleration || vec2(0.0);
            this.restitution = opt.restitution != null ? opt.restitution : 0.1;
            this.friction    = opt.friction != null ? opt.friction : 0.5;

            //形状による慣性モーメントを計算
            this.inertia = this._shape.calcInertia(mass);

            //for debug.
            this._color  = opt.color || 'black';
        },

        /**
         * 保持している形状のコライダ配列を返す
         * @return {Array.<Phys2D.Collider>}
         */
        getColliders: function () {
            return this._shape.colliders;
        },

        /**
         * @return {vec2}
         */
        getCenter: function () {
            return vec2.applyMatrix3(vec2.zero, this.matrix);
        },

        //TODO
        /**
         * レンダリング
         */
        draw: function (ctx, center) {

            var scale = 100;
            var vertices = this.getVertices();

            ctx.save();
            ctx.beginPath();
            ctx.scale(scale, scale);
            ctx.translate(center.x / scale, center.y / scale);

            if (ns.CircleShape.prototype.isPrototypeOf(this._shape)) {
                debugger;
                ctx.moveTo(vertices[0][0], -vertices[0][1]);
                ctx.arc(0, 0, this._shape.radius, 0, Pi2, false);
            }
            else {
                ctx.moveTo(vertices[0][0], -vertices[0][1]);

                for (var i = 1, l = vertices.length; i < l; i++) {
                    ctx.lineTo(vertices[i][0], -vertices[i][1]);
                }
            }

            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.RigidBody = RigidBody;
 
}(Phys2D));
