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
                    if (bodies[i] === bodies[j]) {
                        continue;
                    }

                    if (_isOverlap(bodies[j], bodies[i])) {
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
                this.pairs = pairs;
            }
            else {
                for (var i = 0, l = pairs.length; i < l; i++) {
                    for (var j = 0, k = this.pairs.length; j < k; j++) {
                        if (pairs[i].uuid === this.pairs[j].uuid) {
                            stayPairs.push(this.pairs[j]);
                        }
                        else {
                            newPairs.push(pairs[i]);
                        }
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
            // var that = this;
            // var contact = new ns.Contact(triangle1, triangle2, {
            //     renderer: renderer,
            //     scene: scene,
            //     contact: function (cp) {
            //         that.pair = new Phys2D.Solver(triangle1, triangle2, cp);
            //     }
            // });

            // contact = null;
        },

        /**
         * 拘束の解消（衝突応答）
         * ナローフェーズで得られたペアを元に、衝突応答を計算する
         * @param {Phys2D.Pair} pair 検出された2つの物体のペア情報
         */
        _solveConstraint: function (pair, opt) {
            // var solver = new ns.Solver(
            //         pair.objA,
            //         pair.objB,
            //         pair.contactPoint,
            //         opt
            //     );
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
        step: function (timeStep) {
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
