(function (ns) {

    var DEBUG = true;

    /**
     * ふたつの物体の衝突応答（拘束の解消）を行う
     * @class
     * @param {Object2D} objA 物体A
     * @param {Object2D} objB 物体B
     * @param {ContactPoint} contactPoint 衝突点
     * @param {Object} opt オプション
     */
    var Solver = Class.extend({
        init: function (objA, objB, contactPoint, opt) {

            opt || (opt = {});

            this._objA = objA;
            this._objB = objB;
            this._contactPoint = contactPoint;
            this._objAVert = objA.getVertices();
            this._objBVert = objB.getVertices();
            this._originPos = vec2(0.0000001);

            //for debug.
            this._scene    = opt.scene;
            this._renderer = opt.renderer;

            this._calcImpulse();
        },

        /**
         * For debug.
         */
        _render: function () {
            this._renderer.render(this._scene);
        },
        _drawPoint: function (v, opt) {
            if (!DEBUG) {
                return;
            }

            var p = new ns.Point(v, opt);
            this._scene.add(p);
            this._render();
        },
        _drawLine: function (v1, v2, opt) {
            if (!DEBUG) {
                return;
            }

            var l = new ns.Line(v1, v2, opt);
            this._scene.add(l);
            this._render();
        },
        _drawTriangle: function (v1, v2, v3, opt) {
            if (!DEBUG) {
                return;
            }

            var t = new ns.Triangle(v1, v2, v3, opt);
            this._scene.add(t);
            this._render();
        },

        /**
         * 衝突点を元に、撃力を計算
         * J = (1 + e) * 
         * m1m2 / m1 + m2 + m1m2((I_1^-1(r_1 x n)) x r_1 + (I_2^-1(r_2 x n))  x r_2)・n
         * * ⊿V12
         */
        _calcImpulse: function () {

            var cp   = this._contactPoint.contactPoint;
            var dp   = this._contactPoint.depthPoint;
            var objA = this._objA;
            var objB = this._objB;

            var massA = objA.mass;
            var massB = objB.mass;
            var massAB = massA * massB;

            var IA = 1 / objA.inertia;
            var IB = 1 / objB.inertia;

            var e = objA.restitution + objB.restitution;
            var dV_AB = vec3(vec2.add(vec2.multiplyScalar(objA.velocity, 1 / 16), vec2.multiplyScalar(objB.velocity, 1 / 16)));

            //いったん衝突法線を3次元ベクトルにする
            var normal = vec3(vec2.normalize(dp), 0);

            var _r = vec2.applyMatrix3(vec2(0), objA.matrix);
            var r1 = vec3(vec2.sub(cp, _r));
            var r2 = vec3(cp, 0);

            var J1 = (1 + e);
            var J2 = massAB / (
                massA + massB +
                massAB *
                vec3.dot(
                    vec3.add(
                        vec3.cross(vec3.multiplyScalar(vec3.cross(r1, normal), IA), r1),
                        vec3.cross(vec3.multiplyScalar(vec3.cross(r2, normal), IB), r2)
                    ),
                    normal
                )
            );
            var J3 = vec3.dot(dV_AB, normal);

            var J = J1 * J2 * J3;
        },

        solve: function () {


        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Solver = Solver;
 
}(Phys2D));
