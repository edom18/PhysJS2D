
(function (ns) {

    var DEBUG = false;
    var sqrt = Math.sqrt;
    var DEG_TO_RAD = Math.PI / 180;

    /**
     * ふたつの物体の衝突応答（拘束の解消）を行う
     * @class
     * @param {Array.<Phys2D.Object2D>} rigidbodies 剛体配列
     * @param {Array.<Phys2D.Pair>} pairs ペア情報配列
     */
    var Solver = Class.extend({
        init: function (rigidbodies, pairs) {
            this._rigidbodies = rigidbodies;
            this._pairs = pairs;
            // this._objA  = pair.objA;
            // this._objB  = pair.objB;
            // this._contacts = pair.contacts;
            // this._pairType = pair.typeNew;
            // this._objAVert = this._objA.getVertices();
            // this._objBVert = this._objB.getVertices();
            this._originPos = vec2(0.0000001);
            this._solveConstraints();
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
         * 衝突点を元に撃力を計算
         */
        // calcImpulse: function () {

        //     //結果の初期化
        //     var solved = {
        //         DVA: vec2.zero,
        //         DOA: 0,
        //         DVB: vec2.zero,
        //         DOB: 0
        //     };
        //     var temp = null;

        //     if (this._contacts.length !== 0) {
        //     // for (var i = 0, l = this._contacts.length; i < l; i++) {
        //         // temp = this._calcImpulse(this._contacts[i]);
        //         temp = this._calcImpulse();
        //         solved.DOA += temp.DOA;
        //         solved.DOB += temp.DOB;
        //         solved.DVA = vec2.add(solved.DVA, temp.DVA);
        //         solved.DVB = vec2.add(solved.DVB, temp.DVB);
        //     // }
        //     }

        //     return solved;
        // },

        /**
         * 衝突点を元に、撃力を計算
         * @return {vec2}
         */
        // _calcImpulse: function (contactPoint) {

        //     var cp   = contactPoint.contactPoint;
        //     var dp   = contactPoint.depthPoint;
        //     var objA = this._objA;
        //     var objB = this._objB;

        //     var massA = objA.mass;
        //     var massB = objB.mass;
        //     var imassA = massA ? 1 / massA : 0;
        //     var imassB = massB ? 1 / massB : 0;

        //     var IA = objA.inertia;
        //     var IB = objB.inertia;
        //     var iIA = IA ? 1 / IA : 0;
        //     var iIB = IB ? 1 / IB : 0;

        //     var e = this._pairType ? 0.5 * (objA.restitution + objB.restitution) : 0.0;

        //     //いったん衝突法線を3次元ベクトルにする
        //     var n = vec2.normalize(dp);
        //     var normal = vec3(n, 0);

        //     var _r1 = vec2.sub(cp, objA.getCenter());
        //     var r1  = vec3(_r1, 0);
        //     var _r2 = vec2.sub(cp, objB.getCenter());
        //     var r2  = vec3(_r2, 0);

        //     // TODO タイムステップを求める
        //     var t = 1 / this.timeStep;
        //     var OA = vec3.cross(vec3(0, 0, objA.angularVelocity * t), r1);
        //     var VA = vec3.add(vec3(objA.velocity, 0), OA);

        //     var OB = vec3.cross(vec3(0, 0, objB.angularVelocity * t), r2);
        //     var VB = vec3.add(vec3(objB.velocity, 0), OB);
        //     
        //     var bias   = ns.contactBias;
        //     var posCor = vec2.multiplyScalar(dp, bias);

        //     //2つの物体の相対速度を求める（V1 - V2）
        //     var dV_AB  = vec3.add(vec3.sub(VA, VB), vec3(posCor, 0));

        //     // debugger;
        //     var oldImpulse = this._pair.accumImpulse;
        //     var J = (-(1 + e) * vec3.dot(dV_AB, normal)) / (
        //             (imassA + imassB) + 
        //             vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r1, normal), iIA), r1)) +
        //             vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r2, normal), iIB), r2))
        //         );

        //     this._pair.accumImpulse = Phys2D.clamp(-Number.MAX_VALUE, 0, oldImpulse + J);
        //     J = this._pair.accumImpulse - oldImpulse;

        //     var DVA = vec2.multiplyScalar(n, J * imassA);
        //     var DOA = vec3.multiplyScalar(vec3.cross(r1, vec3.multiplyScalar(normal, J)), iIA).z;

        //     var DVB = vec2.multiplyScalar(n, J * imassB);
        //     var DOB = vec3.multiplyScalar(vec3.cross(r2, vec3.multiplyScalar(normal, J)), iIB).z;

        //     return {
        //         DVA: DVA,
        //         DOA: DOA,
        //         DVB: DVB,
        //         DOB: DOB
        //     };
        // }

        _calcTangentVector: function (normal, tangent1) {

            var v = vec3(1.0, 0.0, 0.0);
            var n = vec3(normal);
            n.x = 0.0;

            if (vec3.lengthSqr(n) < ns.EPSILON) {
                v = vec3(0.0, 1.0, 0.0);
            }

            var tan1 = vec3.normalize(vec3.cross(normal, v));

            vec3.copy(tan1, tangent1);
        },

        _solveConstraints: function () {

            var pars = this.pars;
            var solverBodies = [];
            var bias = ns.contactBias;
            var slop = ns.slop;
            var iteration = ns.iteration;
            var timeStep = 1 / 16;

            //ソルバー用プロキシを作成
            //剛体の情報のうち、拘束の解消に使うものをコピー
            for (var i = 0, l = this._rigidbodies.length; i < l; i++) {
                var body = this._rigidbodies[i];
                var solverBody = new ns.SolverBody(body);
                solverBodies.push(solverBody);
            }

            //拘束のセットアップ
            for (var i = 0, l = this._pairs.length; i < l; i++) {
                var pair = this._pairs[i];
                var bodyA = this._rigidbodies[pair.objA.id];
                var solverBodyA = solverBodies[pair.objA.id];

                var bodyB = this._rigidbodies[pair.objB.id];
                var solverBodyB = solverBodies[pair.objB.id];

                pair.friction = sqrt(bodyA.friction * bodyB.friction);

                if (pair.contacts.length === 0) {
                    continue;
                }

                for (var j = 0, k = pair.contacts.length; j < k; j++) {
                    var contact = pair.contacts[j];
                    var cp = contact.contactPoint;
                    var dp = contact.depthPoint;

                    var r1 = vec3(vec2.sub(cp, solverBodyA.centerVert), 0);
                    var r2 = vec3(vec2.sub(cp, solverBodyB.centerVert), 0);

                    //いったん衝突法線を3次元ベクトルにする
                    var n = vec2.normalize(dp);
                    var normal = vec3(n, 0);

                    var velocityA = vec3.add(vec3(bodyA.velocity, 0), vec3.cross(vec3(0, 0, bodyA.angularVelocity * DEG_TO_RAD), r1));
                    var velocityB = vec3.add(vec3(bodyB.velocity, 0), vec3.cross(vec3(0, 0, bodyB.angularVelocity * DEG_TO_RAD), r2));

                    //2つの物体の相対速度を求める（V1 - V2）
                    var relativeVelocity  = vec3.sub(velocityA, velocityB);

                    var tangent1 = vec3(0.0);

                    //接線ベクトルを求める
                    this._calcTangentVector(normal, tangent1);
                    
                    var restitution = pair.typeNew ? 0.5 * (bodyA.restitution + bodyB.restitution) : 0.0;

                    // 衝突法線方向の計算
                    {
                        var axis = normal;

                        //rhs = Right Hand Side = 右辺
                        contact.constraints[0].jacDiagInv = 1.0 / (
                            (solverBodyA.massInv + solverBodyB.massInv) + 
                            vec3.dot(axis, vec3.cross(vec3.multiplyScalar(vec3.cross(r1, axis), solverBodyA.inertiaInv), r1)) +
                            vec3.dot(axis, vec3.cross(vec3.multiplyScalar(vec3.cross(r2, axis), solverBodyB.inertiaInv), r2))
                        );
                        contact.constraints[0].rhs = (-(1 + restitution) * vec3.dot(relativeVelocity, axis));
                        contact.constraints[0].rhs -= (bias * Math.max(0.0, contact.distance + slop)) * timeStep; // position error
                        contact.constraints[0].rhs *= contact.constraints[0].jacDiagInv;
                        contact.constraints[0].lowerLimit = 0.0;
                        contact.constraints[0].upperLimit = Number.MAX_VALUE;
                        contact.constraints[0].axis = axis;
                    }

                    //Tangent1
                    {
                        var axis = tangent1;
                        contact.constraints[1].rhs = -vec3.dot(relativeVelocity, axis);
                        contact.constraints[1].rhs *= contact.constraints[1].jacDiagInv;
                        contact.constraints[1].lowerLimit = 0.0;
                        contact.constraints[1].upperLimit = 0.0;
                        contact.constraints[1].axis = axis;
                    }

                    //Warm starting
                    {
                        //あとで
                    }
                }
            }

            //拘束の演算
            for (var itr = 0; itr < iteration; itr++) {
                for (var i = 0, l = this._pairs.length; i < l; i++) {

                    var pair = this._pairs[i];
                    var solverBodyA = solverBodies[pair.objA.id];
                    var solverBodyB = solverBodies[pair.objB.id];

                    //検出された衝突情報を元に撃力を計算
                    for (var j = 0, k = pair.contacts.length; j < k; j++) {

                        var contact = pair.contacts[j];
                        var cp = contact.contactPoint;
                        var r1 = vec3(vec2.sub(cp, solverBodyA.centerVert), 0);
                        var r2 = vec3(vec2.sub(cp, solverBodyB.centerVert), 0);

                        {
                            var constraint = contact.constraints[0];
                            var deltaImpulse = constraint.rhs;
                            var deltaVelocityA = vec3.add(vec3(solverBodyA.deltaLinearVelocity, 0), vec3.cross(vec3(0.0, 0.0, solverBodyA.deltaAngularVelocity), r1));
                            var deltaVelocityB = vec3.add(vec3(solverBodyB.deltaLinearVelocity, 0), vec3.cross(vec3(0.0, 0.0, solverBodyB.deltaAngularVelocity), r1));

                            //TODO
                            // debugger;
                            deltaImpulse -= constraint.jacDiagInv * vec3.dot(constraint.axis, vec3.sub(deltaVelocityA, deltaVelocityB));

                            var oldImpulse = constraint.accumImpulse;
                            constraint.accumImpulse = ns.clamp(-constraint.upperLimit, constraint.lowerLimit, oldImpulse + deltaImpulse);

                            deltaImpulse = constraint.accumImpulse - oldImpulse;
                            solverBodyA.deltaLinearVelocity = vec2.add(solverBodyA.deltaLinearVelocity, vec2.multiplyScalar(constraint.axis, deltaImpulse * solverBodyA.massInv));
                            solverBodyA.deltaAngularVelocity += deltaImpulse * solverBodyA.inertiaInv * vec2.cross(r1, constraint.axis);

                            solverBodyB.deltaLinearVelocity = vec2.sub(solverBodyB.deltaLinearVelocity, vec2.multiplyScalar(constraint.axis, deltaImpulse * solverBodyB.massInv));
                            solverBodyB.deltaAngularVelocity += deltaImpulse * solverBodyB.inertiaInv * vec2.cross(r2, constraint.axis);
                        }
                    }
                }
            }

            //計算結果を速度、回転に追加
            for (var i = 0, l = this._rigidbodies.length; i < l; i++) {
                var body = this._rigidbodies[i];
                body.velocity = vec2.add(body.velocity, solverBodies[i].deltaLinearVelocity);
                body.angularVelocity += solverBodies[i].deltaAngularVelocity;
            }

                    // var oldImpulse = pair.accumImpulse;
                    // var J = (-(1 + restitution) * vec3.dot(relativeVelocity, normal)) / (
                    //         (solverBodyA.massInv + solverBodyB.massInv) + 
                    //         vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r1, normal), solverBodyA.inertiaInv), r1)) +
                    //         vec3.dot(normal, vec3.cross(vec3.multiplyScalar(vec3.cross(r2, normal), solverBodyB.inertiaInv), r2))
                    //     );

                    // pair.accumImpulse = Phys2D.clamp(-Number.MAX_VALUE, 0, oldImpulse + J);
                    // J = pair.accumImpulse - oldImpulse;

                    // var DVA = vec2.multiplyScalar(n, J * solverBodyA.massInv);
                    // var DOA = vec3.multiplyScalar(vec3.cross(r1, vec3.multiplyScalar(normal, J)), solverBodyA.inertiaInv).z;

                    // var DVB = vec2.multiplyScalar(n, J * solverBodyB.massInv);
                    // var DOB = vec3.multiplyScalar(vec3.cross(r2, vec3.multiplyScalar(normal, J)), solverBodyB.inertiaInv).z;
        }

                // pair.objA.velocity = vec2.add(pair.objA.velocity, DVA);
                // pair.objA.angularVelocity += DOA;

                // pair.objB.velocity = vec2.sub(pair.objB.velocity, DVB);
                // pair.objB.angularVelocity -= DOB;
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Solver = Solver;
 
}(Phys2D));
