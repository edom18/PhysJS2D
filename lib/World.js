(function (ns) {

    var _rigidBodyIndex = 0;

    /**
     * 物理演算ワールドを生成
     * @class
     */
    var World = Class.extend({
        init: function () {
            this.rigidbodies = [];
            this.pairs = [];
            this.prevTime = 0;
            this.time = 0;
        },

        /**
         * 各物体の状態をアップデートする
         */
        _update: function () {

            var bodies = this.rigidbodies;

            for (var i = 0, l = bodies.length; i < l; i++) {
                bodies[i].update();
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

                    if (!(
                        AABB1.minX > AABB2.maxX ||
                        AABB1.minY > AABB2.maxY ||
                        AABB2.minX > AABB1.maxX ||
                        AABB2.minY > AABB1.maxY
                    )) {
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
                            // this.pairs[j].typeNew = false;
                            // stayPairs.push(this.pairs[j]);
                        }
                        // else {
                        //     newPairs.push(pairs[i]);
                        // }
                    }

                    if (newPair) {
                        newPairs.push(pairs[i]);
                    }
                    else {
                        pair.typeNew = false;
                        stayPairs.push(pair);
                    }
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
         */
        _solveConstraint: function () {

            var pairs  = this.pairs;
            var pair   = null;
            var temp   = null;
            var solved = null;

            if (pairs.length > 0) {
                new Phys2D.Solver(this.rigidbodies, this.pairs);
            }
        },

        /**
         * 物理演算ワールドに物体を追加
         * @param {Phys2D.Object2D} obj2d
         */
        add: function (obj2d) {
            obj2d.id = _rigidBodyIndex++;
            this.rigidbodies.push(obj2d);
        },

        /**
         * 物理計算の時間を進める
         * @param {number} timeStep
         */
        step: function () {
            this._update();
            this._broadPhase();
            this._detectCollision();
            this._solveConstraint();
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.World = World;
 
}(Phys2D));
