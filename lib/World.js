(function (ns) {

    var _rigidBodyIndex = 0;

    /**
     * 物理演算ワールドを生成
     * @class
     * @param {vec2} gravity
     */
    var World = Class.extend({
        $class: 'World',
        init: function (gravity) {
            this._gravity = gravity;
            this.rigidbodies = [];
            this.pairs = [];
            this.prevTime = 0;
            this.time = 0;
        },

        /**
         * 各物体の状態をアップデートする
         * @param {number} timeStep
         */
        _update: function (timeStep) {

            var bodies = this.rigidbodies;

            for (var i = 0, l = bodies.length; i < l; i++) {
                if (bodies[i].mass > 0) {
                    var acc = vec2.multiplyScalar(this._gravity,  timeStep);
                    bodies[i].velocity = vec2.add(bodies[i].velocity, acc);
                }
                bodies[i].update(timeStep);
            }
        },

        /**
         * ブロードフェーズ
         * 衝突可能性のある物体のペアを見つける
         */
        _broadPhase: function () {

            var pair      = null,
                pairs     = [],
                newPairs  = [],
                stayPairs = [],
                bodies = this.rigidbodies,
                AABB1  = null,
                AABB2  = null;

            function _isOverlap(a, b) {
                for (var i = 0, l = pairs.length; i < l; i++) {
                    if (a.id + '-' + b.id === pairs[i].uuid) {
                        return true;
                    }
                }

                return false;
            }

            for (var i = 0, l = bodies.length; i < l; i++) {
                for (var j = 0, k = bodies.length; j < k; j++) {
                    //同じ物体同士はスキップ
                    if (bodies[i] === bodies[j]) {
                        continue;
                    }

                    //すでに検出済のペアの場合はスキップ
                    if (_isOverlap(bodies[j], bodies[i])) {
                        continue;
                    }

                    //ワールド固定配置物体同士はスキップ
                    if (bodies[i].mass === 0 && bodies[j].mass === 0) {
                        continue;
                    }

                    var AABB1 = bodies[i].getAABB();
                    var AABB2 = bodies[j].getAABB();

                    if (
                        AABB1.maxX > AABB2.minX &&
                        AABB1.minX < AABB2.maxX &&
                        AABB1.maxY > AABB2.minY &&
                        AABB1.minY < AABB2.maxY
                    ) {
                        pair = new ns.Pair(bodies[i], bodies[j]);
                        pairs.push(pair);
                        pair = null;
                    }
                }
            }

            if (this.pairs.length === 0) {
                //new pairs.
                this.pairs = pairs;
            }
            else {
                //すでに検出済のペアかどうかのチェック
                for (var i = 0, l = pairs.length; i < l; i++) {
                    var newPair = true;
                    var pair;

                    for (var j = 0, k = this.pairs.length; j < k; j++) {
                        if (pairs[i].uuid === this.pairs[j].uuid) {
                            newPair = false;
                            pair = this.pairs[j];
                            break;
                        }
                    }

                    if (newPair) {
                        newPairs.push(pairs[i]);
                    }
                    else {
                        pair.typeNew = false;
                        stayPairs.push(pair);
                    }
                }

                for (var i = 0, l = stayPairs.length; i < l; i++) {
                    stayPairs[i].refreshContactPoint();
                }
                this.pairs = newPairs.concat(stayPairs);
            }


            pairs     = null;
            newPairs  = null;
            stayPairs = null;
        },

        /**
         * ナローフェーズ
         * 詳細な衝突検出を行う
         */
        _detectCollision: function () {

            var pairs = this.pairs;

            for (var i = 0, l = pairs.length; i < l; i++) {
                var cp = new ns.Contact(pairs[i].objA, pairs[i].objB).detect();

                if (cp) {
                    pairs[i].addContactPoint(cp);
                }

                cp = null;
            }
        },

        /**
         * 拘束の解消（衝突応答）
         * ナローフェーズで得られたペアを元に、衝突応答を計算する
         * @param {number} timeStep
         */
        _solveConstraint: function (timeStep) {
            if (this.pairs.length > 0) {
                new Phys2D.Solver(timeStep, this.rigidbodies, this.pairs);
            }
        },

        /**
         * 物理演算ワールドに物体を追加
         * @param {Phys2D.RigidBody} rigidbody
         */
        add: function (rigidbody) {
            rigidbody.id = _rigidBodyIndex++;
            this.rigidbodies.push(rigidbody);
        },

        /**
         * 物理計算の時間を進める
         * @param {number} timeStep
         */
        step: function (timeStep) {
            this._update(timeStep);
            this._broadPhase();
            this._detectCollision();
            this._solveConstraint(timeStep);
        },

        setGraivty: function (gravity) {
            this._gravity = gravity;
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.World = World;
 
}(Phys2D));
