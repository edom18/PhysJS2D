(function (ns) {

    var Pi2 = Math.PI * 2,
        xAxis = vec2.right,
        yAxis = vec2.up,

        polygonShapeBit = ns.shapeType.polygonShapeBit,
        circleShapeBit  = ns.shapeType.circleShapeBit;

    function sortFunc(a, b) {
        return a - b;
    }

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

            this.shapeType = shape.type;

            if (shape.radius) {
                this.radius = shape.radius;
            }

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

        //現在の頂点情報から、AABBの情報を得る
        getAABB: function () {

            if (this.shapeType === polygonShapeBit) {
                var vertices = this.getVertices();
                var dot;
                var temp = [];

                //X軸のmin, maxを得る
                for (var i = 0, l = vertices.length; i < l; i++) {
                    temp.push(vec2.dot(xAxis, vertices[i]));
                }

                temp.sort(sortFunc);
                this.AABB.minX = temp[0] * 1.1;
                this.AABB.maxX = temp[vertices.length - 1] * 1.1;

                //Y軸のmin, maxを得る
                temp = [];
                for (var i = 0, l = vertices.length; i < l; i++) {
                    temp.push(vec2.dot(yAxis, vertices[i]));
                }

                temp.sort(sortFunc);
                this.AABB.minY = temp[0] * 1.1;
                this.AABB.maxY = temp[vertices.length - 1] * 1.1;
            }
            else if (this.shapeType === circleShapeBit) {
                var center = this.getCenter();
                var radius = this.radius;
                this.AABB.minX = center.x - radius;
                this.AABB.minY = center.y - radius;
                this.AABB.maxX = center.x + radius;
                this.AABB.maxY = center.y + radius;
            }

            return this.AABB;
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
                ctx.arc(vertices[0][0], -vertices[0][1], this._shape.radius, 0, Pi2, false);
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
