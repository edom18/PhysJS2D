
(function (ns) {

    var DEBUG = false;
    var sqrt = Math.sqrt;

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
            var imassA = 1 / massA;
            var imassB = 1 / massB;

            var IA = objA.inertia;
            var IB = objB.inertia;
            var iIA = 1 / IA;
            var iIB = 1 / IB;

            var e = sqrt(objA.restitution * objB.restitution);

            //いったん衝突法線を3次元ベクトルにする
            var n = vec2.normalize(dp);
            var normal = vec3(n, 0);

            var _r1 = vec2.sub(cp, objA.getCenter());
            var r1  = vec3(_r1, 0);
            var _r2 = vec2.sub(cp, objB.getCenter());
            var r2  = vec3(_r2, 0);

            // TODO タイムステップを求める
            //2つの物体の相対速度を求める（V1 - V2）
            var t = 1 / 16;
            var OA = vec3.cross(vec3(0, 0, objA.angularVelocity * t), r1);
            var VA = vec3.add(vec3(objA.velocity, 0), OA);

            var OB = vec3.cross(vec3(0, 0, objB.angularVelocity * t), r2);
            var VB = vec3.add(vec3(objB.velocity, 0), OB);
            
            var bias   = 1;
            var posCor = vec2.multiplyScalar(dp, bias);
            var dV_AB  = vec3.add(vec3.sub(VA, VB), vec3(posCor, 0));

            var J = (-(1 + e) * vec3.dot(dV_AB, normal)) / (
                    (imassA + imassB) + 
                    vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r1, normal), iIA), r1)) +
                    vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r2, normal), iIB), r2))
                );

            var DVA = vec2.multiplyScalar(n, J * imassA);
            var DOA = vec3.multiplyScalar(vec3.cross(r1, vec3.multiplyScalar(normal, J)), iIA).z;

            var DVB = vec2.multiplyScalar(n, J * imassB);
            var DOB = vec3.multiplyScalar(vec3.cross(r2, vec3.multiplyScalar(normal, J)), iIB).z;

            objA.velocity = vec2.add(objA.velocity, DVA);
            objA.angularVelocity += DOA;

            objB.velocity = vec2.sub(objB.velocity, DVB);
            objB.angularVelocity -= DOB;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Solver = Solver;
 
}(Phys2D));
