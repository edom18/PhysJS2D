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

            var IA = objA.inertia;
            var IB = objB.inertia;
            var iIA = 1 / IA;
            var iIB = 1 / IB;

            var e = objA.restitution + objB.restitution;

            //2つの物体の相対速度を求める（V1 - V2）
            var dV_AB = vec3(vec2.sub(objA.velocity, objB.velocity));

            //いったん衝突法線を3次元ベクトルにする
            var n = vec2.normalize(dp);
            var iN = vec2.minus(n);
            var normal = vec3(n, 0);

            var _r  = vec2.applyMatrix3(vec2(0), objA.matrix);
            var _r1 = vec2.sub(cp, _r);
            var r1  = vec3(_r1, 0);
            var _r2 = cp;
            var r2  = vec3(_r2, 0);

            var J = (-(1 + e) * vec3.dot(dV_AB, normal)) / (
                    (1 / massA + 1 / massB) + 
                    vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r1, normal), iIA), r1)) +
                    vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r2, normal), iIB), r2))
                );

            var J1 = (1 + e);
            var J2 = massAB / (
               massA + massB +
               massAB *
               vec3.dot(
                   vec3.add(
                       vec3.cross(vec3.multiplyScalar(vec3.cross(r1, normal), iIA), r1),
                       vec3.cross(vec3.multiplyScalar(vec3.cross(r2, normal), iIB), r2)
                   ),
                   normal
               )
            );
            var J3 = vec3.dot(dV_AB, normal);
            var _J = J1 * J2 * J3;

            var dva = vec2.multiplyScalar(iN, (1 / massA) * _J);
            var doa = iIA * vec2.cross(_r1, n) * _J;
            var dvb = vec2.multiplyScalar(iN, (-1 / massB) * _J);
            var dob = -iIB * vec2.cross(_r2, n) * _J;

            debugger;
            var VA = vec2.multiplyScalar(n, J / massA);
            var OA = vec3.multiplyScalar(vec3.cross(r1, vec3.multiplyScalar(normal, J)), iIA).z;

            var VB = vec2.multiplyScalar(n, J / massB);
            var OB = vec3.multiplyScalar(vec3.cross(r2, vec3.multiplyScalar(normal, J)), iIB).z;

            objA.angularVelocity += doa;
            objA.velocity = vec2.add(objA.velocity, dva);

            objB.angularVelocity += dob;
            objB.velocity = vec2.add(objB.velocity, dvb);
        },

        solve: function () {


        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Solver = Solver;
 
}(Phys2D));
