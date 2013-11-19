(function (ns) {

    var DEBUG = true;

    var ContactPoint = Class.extend({
        init: function () {

        }
    });

    /**
     * ふたつの物体の詳細衝突判定を行う
     * @class
     * @param {Object2D} objA
     * @param {Object2D} objB
     */
    var Contact = Class.extend({
        init: function (objA, objB, opt) {

            opt || (opt = {});

            this._objA = objA;
            this._objB = objB;
            this._objAVert = objA.getVertices();
            this._objBVert = objB.getVertices();
            this._foundPoints = [];
            this._originPos = vec2(0.0000001);
            this._contact   = opt.contact || function () {};
            this._nocontact = opt.nocontact || function () {};

            //for debug.
            this._scene    = opt.scene;
            this._renderer = opt.renderer;

            this._detect();
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
         * 貫通深度を求める
         */
        _calcPenetrationDepth: function () {

            var points    = [].slice.call(this._foundPoints),
                originPos = this._originPos,
                detectPointOnLine = ns.detectPointOnLine;

            var that = this;

            /**
             * 各辺への最短点を求める
             * @param {Array.<vec2>} points 多角形を形成する頂点群
             * @return {vec2} 検出された最短点の座標
             */
            function _chooseNearPoint(points) {

                var distance  = Number.MAX_VALUE,
                    len       = 0,
                    nearPoint = null,
                    result    = null;

                //最後の頂点と最初の頂点で作られる辺のチェック
                nearPoint = detectPointOnLine(points[points.length - 1], points[0], originPos);
                distance  = vec2.norm(vec2.sub(nearPoint, originPos));
                result    = nearPoint;

                //debug
                // that._drawPoint(nearPoint, {
                //     color: 'rgba(255, 255, 255, 0.3)'
                // });
                // that._drawLine(originPos, nearPoint, {
                //     color: '#fff'
                // });

                //残りの辺すべてをチェック
                for (var i = 1, l = points.length; i < l; i++) {
                    nearPoint = detectPointOnLine(points[i - 1], points[i], originPos);

                    //debug
                    // that._drawPoint(nearPoint, {
                    //     color: 'rgba(255, 255, 255, 0.3)'
                    // });
                    // that._drawLine(originPos, nearPoint, {
                    //     color: '#fff'
                    // });

                    len  = vec2.norm(vec2.sub(nearPoint, originPos));

                    if (distance > len) {
                        distance = len;
                        result = nearPoint;
                    }
                }

                return result;
            }

            // debugger;

            var support   = null;
            var newPoint  = null;
            var nearPoint = null;
            var result    = null;

            while (!result) {

                //debug
                // this._drawTriangle(points[0], points[1], points[2], {
                //     color: 'rgba(255, 255, 255, 0.1)'
                // })

                nearPoint = _chooseNearPoint(points);

                //debug
                // this._drawPoint(nearPoint, {
                //     color: 'green'
                // });

                support  = vec2.sub(nearPoint, originPos);
                newPoint = this._getMinkowskiSupport(support);

                //debug
                // this._drawPoint(newPoint, {
                //     color: 'blue'
                // });

                for (var i = 0, l = points.length; i < l; i++) {
                    if (vec2.equal(newPoint, points[i])) {
                        result = newPoint;
                        break;
                    }
                }

                points.unshift(newPoint);
            }

            //得られた多角形から最短距離を算出
            var depth = Number.MAX_VALUE;
            var _rest = null;
            for (var i = 0, l = points.length; i < l; i++) {
                var len = vec2.norm(vec2.sub(points[i], originPos));
                if (depth > len) {
                    depth = len;
                    _rest = points[i];
                }
            }

            var p = detectPointOnLine(points[points.length - 1], points[0], originPos);
            var len = vec2.norm(p);
            if (depth > len) {
                depth = len;
                _rest = p;
            }

            //残りの辺すべてをチェック
            for (var i = 1, l = points.length; i < l; i++) {
                var p = detectPointOnLine(points[i - 1], points[i], originPos);
                var len = vec2.norm(p);
                if (depth > len) {
                    depth = len;
                    _rest = p;
                }
            }

            return _rest;
            // return result;
        },

        /**
         * サポート写像を求める
         *
         * @param {vec2} supportVec 判定する方向のベクトル
         * @param {Array.<vec2>} vertices 判定する頂点配列
         */
        _support: function (supportVec, vertices) {

            var dot = -Number.MAX_VALUE,
                ful = null,
                temp;

            for (var i = 0, l = vertices.length; i < l; i++) {
                temp = vec2.dot(supportVec, vertices[i]);

                if (dot < temp) {
                    dot = temp;
                    ful = vertices[i];
                }
            }

            return vec2(ful);
        },

        /**
         * ベクトルからサポート写像を求める
         * @param {vec2} supportVec
         * @return {Object} 求まったミンコフスキ差の支点と物体A,Bの頂点情報
         */
        _getMinkowskiSupport: function (supportVec) {

            var supportA, supportB,
                fulA, fulB;

            supportA = vec2.normalize(supportVec);
            supportB = vec2.minus(supportA);

            fulA = this._support(supportA, this._objAVert);
            fulB = this._support(supportB, this._objBVert);

            return vec2.sub(fulA, fulB);
        },


        /**
         * ふたつの物体が衝突しているかの判定
         * 判定にはミンコフスキ差が原点を通るかを元に判別
         *
         * @return {boolean} 衝突している場合はtrueを返す
         */
        _isContact: function () {

            var originPos = this._originPos;
            var v0 = this._foundPoints[0];
            var v1 = this._foundPoints[1];
            var v2 = this._foundPoints[2];

            //三角形の各辺のベクトルを得る
            var edge0 = vec2.sub(v1, v0);
            var edge1 = vec2.sub(v2, v1);
            var edge2 = vec2.sub(v0, v2);

            //v0から見た辺の向きベクトルを得る
            var ce0 = vec2.sub(v1, v0);
            var ce1 = vec2.sub(v2, v0);
            var CCW = 1;

            //それぞれの辺の位置関係を外積によって確認し、
            //時計回りか反時計回りかを判定
            //時計回りの場合は、以後の判定のプラスマイナスを逆転させる
            if (vec2.cross(ce0, ce1) < 0) {
                CCW = -1;
            }

            //原点が三角形の辺の内側にあるかを判定
            //3つの辺すべてに置いて内側という判定の場合は
            //原点は三角形の内側に存在している
            var cp0 = vec2.sub(originPos, v0);
            
            if (vec2.cross(edge0, cp0) * CCW <= 0) {
                return false;
            }

            var cp1 = vec2.sub(originPos, v1);
            
            if (vec2.cross(edge1, cp1) * CCW <= 0) {
                return false;
            }

            var cp2 = vec2.sub(originPos, v2);
            
            if (vec2.cross(edge2, cp2) * CCW <= 0) {
                return false;
            }

            return true;
        },

        /**
         * 生成された三角形と原点の一番近い点を見つける
         * @return {vec2}
         */
        _getNearPoint: function () {

            var originPos = this._originPos;
            var nearPoint0 = Phys2D.detectPointOnLine(this._foundPoints[0], this._foundPoints[1], originPos);
            var nearPoint1 = Phys2D.detectPointOnLine(this._foundPoints[0], this._foundPoints[2], originPos);

            return (vec2.norm(nearPoint0) < vec2.norm(nearPoint1)) ? nearPoint0 : nearPoint1;
        },


        /**
         * 原点が、得られた三角形内に存在するかをチェック
         * また、再帰的に新しい三角形を作成し、新しいポイントが得られなくなるまで繰り返す
         */
        _checkCenterInTriangle: function () {

            var originPos = this._originPos;
            var support;
            var ful;

            // this._drawTriangle(this._foundPoints[0], this._foundPoints[1], this._foundPoints[2], {
            //     color: 'rgba(255, 255, 255, 0.2)'
            // });

            //三角形内に原点があった場合は衝突している
            if (this._isContact()) {
                var depth = this._calcPenetrationDepth();

                //console.log(vec2.norm(depth));
                
                this._contact(depth);

                return true;
            }

            //求まった3点からできる三角形と原点との最短点を見つける
            var nearPoint = this._getNearPoint();

            //debug
            // this._drawPoint(nearPoint, {
            //     color: '#009'
            // });
            // this._drawLine(originPos, nearPoint, {
            //     color: '#009'
            // });

            //求まった点と原点を結んだベクトルのサポート写像を求める
            support = vec2.sub(originPos, nearPoint);

            //支点
            ful = this._getMinkowskiSupport(support);

            //debug
            // this._drawPoint(ful, {
            //     color: '#e00'
            // });

            //三角形の中に原点が見つからず、
            //かつ検出できる支点がなくなった場合は衝突していない
            for (var i = 0, l = this._foundPoints.length; i < l; i++) {
                if (vec2.equal(ful, this._foundPoints[i])) {
                    return false;
                }
            }

            this._foundPoints.unshift(ful);

            //見つかった点を3点までに制限する
            this._slicePoints();

            return this._checkCenterInTriangle();
        },

        /**
         * 求まった点の中で、原点から一番遠い点を除外
         */
        _slicePoints: function () {

            var points   = this._foundPoints,
                distance = 0,
                len      = 0,
                index    = -1,
                point    = null;

            for (var i = 0, l = points.length; i < l; i++) {
                len = vec2.norm(points[i]);

                if (distance < len) {
                    distance = len;
                    point = points[i];
                    index = i;
                }
            }

            points.splice(index, 1);
        },

        /**
         * 衝突検出の開始
         */
        _detect: function () {

            var originPos = this._originPos,
                support,
                ful;

            //objAの中心点から原点へのベクトルによる支点を求める
            support = vec2.sub(originPos, this._objA.getCenter());

            //支点1
            ful = this._getMinkowskiSupport(support);
            this._foundPoints.unshift(ful);

            //debug
            // this._drawPoint(vec2(ful), {
            //    color: 'green'
            // });

            //求まった点と原点を結んだベクトルのサポート写像を求める
            support = vec2.sub(originPos, ful);

            //debug
            // this._drawLine(originPos, ful);

            //支点2
            ful = this._getMinkowskiSupport(support);
            this._foundPoints.unshift(ful);

            //debug
            // this._drawPoint(vec2(ful), {
            //    color: 'yellow'
            // });

            //もし同じ点が求まった場合は収束したとして非衝突状態
            if (vec2.equal(this._foundPoints[0], this._foundPoints[1])) {
                this._nocontact();
                return false;
            }

            //求まった2つの点で作られる線分の最接近点を求める
            var nearPoint = Phys2D.detectPointOnLine(this._foundPoints[1], this._foundPoints[0], originPos);

            //debug
            // this._drawPoint(vec2(nearPoint), {
            //     color: '#00c'
            // });

            //求まった点と原点を結んだベクトルのサポート写像を求める
            support = vec2.sub(originPos, nearPoint);

            //支点3
            ful = this._getMinkowskiSupport(support);
            this._foundPoints.unshift(ful);

            //debug
            // this._drawPoint(vec2(ful), {
            //     color: '#0cc'
            // });

            //3点見つかったのでsimplex（単体）による判定へ
            if (!this._checkCenterInTriangle()) {
                // this._contact();
                this._nocontact();
            }
            // else {
            //     this._nocontact();
            // }
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Contact      = Contact;
    ns.ContactPoint = ContactPoint;
 
}(Phys2D));
