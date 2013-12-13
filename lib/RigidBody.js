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
                var maxX = -Number.MAX_VALUE;
                var minX =  Number.MAX_VALUE;
                var maxY = -Number.MAX_VALUE;
                var minY =  Number.MAX_VALUE;
                var x = 0;
                var y = 0;

                for (var i = 0, l = vertices.length; i < l; i++) {
                    x = vertices[i].x
                    y = vertices[i].y
                    if (maxX < x) {
                        maxX = x
                    }
                    if (minX > x) {
                        minX = x;
                    }
                    if (maxY < y) {
                        maxY = y;
                    }
                    if (minY > y) {
                        minY = y;
                    }
                }

                this.AABB.maxX = maxX;
                this.AABB.minX = minX;
                this.AABB.maxY = maxY;
                this.AABB.minY = minY;
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
            ctx.fillStyle = this._color;

            if (ns.CircleShape.prototype.isPrototypeOf(this._shape)) {
                ctx.arc(vertices[0][0], -vertices[0][1], this._shape.radius, 0, Pi2, false);
                ctx.fill();
                ctx.beginPath();

                var pos = vec2(this.radius, 0);
                pos = vec2.applyMatrix3(pos, this.rotationMatrix);
                pos = vec2.applyMatrix3(pos, this.scaleMatrix);

                ctx.moveTo(vertices[0][0], -vertices[0][1]);
                ctx.lineTo(vertices[0][0] + pos.x, -(vertices[0][1] + pos.y));
                ctx.lineWidth = 0.01;
                ctx.stroke();
            }
            else {
                ctx.moveTo(vertices[0][0], -vertices[0][1]);

                for (var i = 1, l = vertices.length; i < l; i++) {
                    ctx.lineTo(vertices[i][0], -vertices[i][1]);
                }

                ctx.fill();
            }

            ctx.closePath();
            ctx.restore();
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.RigidBody = RigidBody;
 
}(Phys2D));
