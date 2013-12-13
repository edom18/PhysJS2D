
(function (ns) {

    var DEBUG = false;
    var sqrt = Math.sqrt;
    var abs  = Math.abs;
    var max  = Math.max;
    var DEG_TO_RAD = Math.PI / 180;
    var RAD_TO_DEG = 180 / Math.PI;

    /**
     * ふたつの物体の衝突応答（拘束の解消）を行う
     * @class
     * @param {Array.<Phys2D.Object2D>} rigidbodies 剛体配列
     * @param {Array.<Phys2D.Pair>} pairs ペア情報配列
     */
    var Solver = Class.extend({
        init: function (timeStep, rigidbodies, pairs) {
            this._timeStep = timeStep;
            this._rigidbodies = rigidbodies;
            this._pairs = pairs;
            this._originPos = vec2(0);
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

        _calcTangentVector: function (normal, tangent1) {

            //TODO 接線ベクトルが正しく取れるかしっかり確認
            var v = vec3(0.0, 0.0, 1.0);
            var n = vec3(normal);
            n.x = 0.0;

            if (vec3.lengthSqr(n) < ns.EPSILON) {
                v = vec3(0.0, 1.0, 0.0);
            }

            var tan1 = vec3.normalize(vec3.cross(normal, v));

            vec3.copy(tan1, tangent1);
        },

        _solveConstraints: function () {

            // debugger;
            var solverBodies = [];
            var bias = ns.contactBias;
            var slop = ns.slop;
            var iteration = ns.iteration;
            var rigidbodies = this._rigidbodies;
            var pairs = this._pairs;
            var timeStep = this._timeStep;

            //ソルバー用プロキシを作成
            //剛体の情報のうち、拘束の解消に使うものをコピー
            for (var i = 0, l = rigidbodies.length; i < l; i++) {
                var body = rigidbodies[i];
                var solverBody = new ns.SolverBody(body);
                solverBodies.push(solverBody);
            }

            //拘束のセットアップ
            for (var i = 0, l = pairs.length; i < l; i++) {

                var pair = pairs[i];

                if (pair.contacts.length === 0) {
                    continue;
                }

                var bodyA = rigidbodies[pair.objA.id];
                var solverBodyA = solverBodies[pair.objA.id];

                var bodyB = rigidbodies[pair.objB.id];
                var solverBodyB = solverBodies[pair.objB.id];

                pair.friction = sqrt(bodyA.friction * bodyB.friction);

                for (var j = 0, k = pair.contacts.length; j < k; j++) {
                    var contact = pair.contacts[j];
                    var cp = contact.contactPoint;
                    var dp = contact.depthPoint;

                    var r1 = vec3(vec2.sub(cp, solverBodyA.centerVert), 0);
                    var r2 = vec3(vec2.sub(cp, solverBodyB.centerVert), 0);

                    //いったん衝突法線を3次元ベクトルにする
                    var n = vec2.normalize(dp);
                    var normal = vec3(n, 0);

                    var velocityA = vec3.add(vec3(bodyA.velocity, 0), vec3.cross(vec3(0, 0, -bodyA.angularVelocity * DEG_TO_RAD), r1));
                    var velocityB = vec3.add(vec3(bodyB.velocity, 0), vec3.cross(vec3(0, 0, -bodyB.angularVelocity * DEG_TO_RAD), r2));

                    //2つの物体の相対速度を求める（V1 - V2）
                    var relativeVelocity  = vec3.sub(velocityA, velocityB);

                    //接線ベクトル用変数
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
                        contact.constraints[0].rhs = -((1 + restitution) * vec3.dot(relativeVelocity, axis));
                        contact.constraints[0].rhs -= (bias * max(0.0, contact.distance + slop)) / timeStep; // position error
                        contact.constraints[0].rhs *= contact.constraints[0].jacDiagInv;
                        contact.constraints[0].lowerLimit = -Number.MAX_VALUE;;
                        contact.constraints[0].upperLimit = 0.0;
                        contact.constraints[0].axis = axis;
                    }

                    //Tangent1
                    {
                        var axis = tangent1;
                        contact.constraints[1].jacDiagInv = 1.0 / (
                            (solverBodyA.massInv + solverBodyB.massInv) + 
                            vec3.dot(axis, vec3.cross(vec3.multiplyScalar(vec3.cross(r1, axis), solverBodyA.inertiaInv), r1)) +
                            vec3.dot(axis, vec3.cross(vec3.multiplyScalar(vec3.cross(r2, axis), solverBodyB.inertiaInv), r2))
                        );
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
                for (var i = 0, l = pairs.length; i < l; i++) {

                    var pair = pairs[i];
                    var solverBodyA = solverBodies[pair.objA.id];
                    var solverBodyB = solverBodies[pair.objB.id];

                    //検出された衝突情報を元に撃力を計算
                    for (var j = 0, k = pair.contacts.length; j < k; j++) {

                        var contact = pair.contacts[j];
                        var cp = contact.contactPoint;
                        var r1 = vec3(vec2.sub(cp, solverBodyA.centerVert), 0);
                        var r2 = vec3(vec2.sub(cp, solverBodyB.centerVert), 0);

                        //Normal
                        {
                            var constraint = contact.constraints[0];
                            var deltaImpulse = constraint.rhs;
                            var deltaVelocityA = vec3.add(vec3(solverBodyA.deltaLinearVelocity, 0), vec3.cross(vec3(0.0, 0.0, -solverBodyA.deltaAngularVelocity), r1));
                            var deltaVelocityB = vec3.add(vec3(solverBodyB.deltaLinearVelocity, 0), vec3.cross(vec3(0.0, 0.0, -solverBodyB.deltaAngularVelocity), r2));

                            deltaImpulse -= constraint.jacDiagInv * vec3.dot(constraint.axis, vec3.sub(deltaVelocityA, deltaVelocityB));

                            var oldImpulse = constraint.accumImpulse;
                            constraint.accumImpulse = ns.clamp(constraint.lowerLimit, constraint.upperLimit, oldImpulse + deltaImpulse);

                            deltaImpulse = constraint.accumImpulse - oldImpulse;
                            solverBodyA.deltaLinearVelocity = vec2.add(solverBodyA.deltaLinearVelocity, vec2.multiplyScalar(constraint.axis, deltaImpulse * solverBodyA.massInv));
                            solverBodyA.deltaAngularVelocity += deltaImpulse * solverBodyA.inertiaInv * vec2.cross(r1, constraint.axis);

                            solverBodyB.deltaLinearVelocity = vec2.sub(solverBodyB.deltaLinearVelocity, vec2.multiplyScalar(constraint.axis, deltaImpulse * solverBodyB.massInv));
                            solverBodyB.deltaAngularVelocity -= deltaImpulse * solverBodyB.inertiaInv * vec2.cross(r2, constraint.axis);
                        }

                        var  maxFriction = pair.friction * abs(contact.constraints[0].accumImpulse);
                        contact.constraints[1].lowerLimit = -maxFriction;
                        contact.constraints[1].upperLimit =  maxFriction;

                        // Tangent
                        {
                            var constraint = contact.constraints[1];
                            var deltaImpulse = constraint.rhs;
                            var deltaVelocityA = vec3.add(vec3(solverBodyA.deltaLinearVelocity, 0), vec3.cross(vec3(0.0, 0.0, -solverBodyA.deltaAngularVelocity), r1));
                            var deltaVelocityB = vec3.add(vec3(solverBodyB.deltaLinearVelocity, 0), vec3.cross(vec3(0.0, 0.0, -solverBodyB.deltaAngularVelocity), r2));

                            deltaImpulse -= constraint.jacDiagInv * vec3.dot(constraint.axis, vec3.sub(deltaVelocityA, deltaVelocityB));

                            var oldImpulse = constraint.accumImpulse;
                            constraint.accumImpulse = ns.clamp(constraint.lowerLimit, constraint.upperLimit, oldImpulse + deltaImpulse);

                            deltaImpulse = constraint.accumImpulse - oldImpulse;
                            solverBodyA.deltaLinearVelocity = vec2.add(solverBodyA.deltaLinearVelocity, vec2.multiplyScalar(constraint.axis, deltaImpulse * solverBodyA.massInv));
                            solverBodyA.deltaAngularVelocity += deltaImpulse * solverBodyA.inertiaInv * vec2.cross(r1, constraint.axis);

                            solverBodyB.deltaLinearVelocity = vec2.sub(solverBodyB.deltaLinearVelocity, vec2.multiplyScalar(constraint.axis, deltaImpulse * solverBodyB.massInv));
                            solverBodyB.deltaAngularVelocity -= deltaImpulse * solverBodyB.inertiaInv * vec2.cross(r2, constraint.axis);
                        }
                    }
                }
            }

            //計算結果を速度、回転に追加
            for (var i = 0, l = rigidbodies.length; i < l; i++) {
                var body = rigidbodies[i];
                var solverBody = solverBodies[i];
                body.velocity = vec2.add(body.velocity, solverBody.deltaLinearVelocity);
                body.angularVelocity += solverBody.deltaAngularVelocity * RAD_TO_DEG;
            }
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Solver = Solver;
 
}(Phys2D));
