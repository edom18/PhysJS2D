(function (ns) {

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
            this._count = 0;
            this._originPos = vec2(0.0000001);
            this._contact = opt.contact || function () {};
            this._nocontact = opt.nocontact || function () {};

            //for debug.
            this._scene = opt.scene;
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
            return;
            var p = new Point(v, opt);
            this._scene.add(p);
            this._render();
        },
        _drawLine: function (v1, v2, opt) {
            return;
            var l = new Line(v1, v2, opt);
            this._scene.add(l);
            this._render();
        },
        _drawTriangle: function (v1, v2, v3, opt) {
            return;
            var t = new Triangle(v1, v2, v3, opt);
            this._scene.add(t);
            this._render();
        },

        /**
         * 貫通深度を求める
         */
        _calcPenetrationDepth: function () {

            return;
            debugger;
            var points    = [].slice.call(this._foundPoints),
                originPos = this._originPos;

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

                for (var i = 0, l = points.length; i < l; i++) {
                    nearPoint = Phys2D.detectPointOnLine(points[i - 1], points[i], originPos);
                    len = vec2.norm(nearPoint);

                    if (distance > len) {
                        distance = len;
                        result = nearPoint;
                    }
                }

                return result;
            }

            var newPoint = null;
            var nearPoint = null;
            var result = null;
            while (true) {
                nearPoint = _chooseNearPoint(points);
                supportA = vec2.sub(originPos, nearPoint);
                supportA = vec2.normalize(supportA);
                supportB = vec2.minus(supportA);

                fulA = this._support(supportA, objAVert);
                fulB = this._support(supportB, objBVert);

                for (var i = 0, l = points.length; i < l; i++) {
                    if (vec2.equal(newPoint, points[i])) {
                        result = newPoint;
                        break;
                    }
                }

                points.push(newPoint);
            }

            return result;
        },

        /**
         * サポート写像を求める
         *
         * @param {vec2} supportVec 判定する方向のベクトル
         * @param {Array.<vec2>} vertices 判定する頂点配列
         */
        _support: function (supportVec, vertices) {

            var dot = -Number.MAX_VALUE;
            var ful = null,
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

            // debugger;
            // this._drawTriangle(this._foundPoints[0], this._foundPoints[1], this._foundPoints[2], {
            //     color: 'rgba(255, 255, 255, 0.2)'
            // });

            //エラー回避の応急処置
            //debug
            this._count++;
            if (this._count > 10) {
                console.log('overflow');
                return;
            }

            //三角形内に原点があった場合は衝突している
            if (this._isContact()) {
                this._calcPenetrationDepth();
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
            // if (vec2.equal(ful, this._foundPoints[0])) {
            //     return false;
            // }
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
                }
            }

            index = points.indexOf(point);
            points.splice(index, 1);
        },

        /**
         * 衝突検出の開始
         */
        _detect: function () {

            var originPos = this._originPos,
                objAVert  = this._objAVert,
                objBVert  = this._objBVert,
                supportA, supportB,
                fulA, fulB;

            // debugger;
            // TODO
            //原点からobjAの中心点のベクトルによる支点を求める
            //（本来は原点へ向かうベクトルだが、
            //原点から一番遠い点を検出することで、処理を安定させる？）
            // supportA = vec2.sub(this._objA.getCenter(), originPos);
            supportA = vec2.sub(originPos, this._objA.getCenter());

            //debug
            //中心から原点へのベクトルを視覚化
            // this._drawLine(originPos, this._objA.getCenter(), {
            //     color: '#fff'
            // });

            //ベクトルを正規化
            supportA = vec2.normalize(supportA);

            //objB用に反転したベクトルを生成
            supportB = vec2.minus(supportA);

            //objAの支点を求める
            fulA = this._support(supportA, objAVert);

            //debug
            // this._drawPoint(vec2(fulA), {
            //     color: 'green'
            // });

            //objBの支点を求める
            fulB = this._support(supportB, objBVert);

            //debug
            // this._drawPoint(vec2(fulB), {
            //     color: 'green'
            // });

            //支点1
            //求めたA,Bのサポート写像を合成し、ミンコフスキ差としての支点を求める
            var ful = vec2.sub(fulA, fulB);
            this._foundPoints.unshift(ful);

            //debug
            // this._drawPoint(vec2(ful), {
            //    color: 'green'
            // });

            //求まった点と原点を結んだベクトルのサポート写像を求める
            supportA = vec2.sub(originPos, ful);

            //debug
            // this._drawLine(originPos, ful);

            supportA = vec2.normalize(supportA);
            supportB = vec2.minus(supportA);

            fulA = this._support(supportA, objAVert);
            fulB = this._support(supportB, objBVert);

            // this._drawPoint(vec2(fulA), {
            //    color: '#999'
            // });
            // this._drawPoint(vec2(fulB), {
            //    color: '#999'
            // });

            //支点2
            ful = vec2.sub(fulA, fulB);
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
            supportA = vec2.sub(originPos, nearPoint);
            vec2.normalize(supportA);
            supportB = vec2.minus(supportA);

            fulA = this._support(supportA, objAVert);
            fulB = this._support(supportB, objBVert);

            //debug
            // this._drawPoint(vec2(fulA), {
            //     color: '#c0c'
            // });
            // this._drawPoint(vec2(fulB), {
            //     color: '#c0c'
            // });
            // this._drawLine(fulA, fulB, {
            //     color: '#fff'
            // });

            //支点3
            ful = vec2.sub(fulA, fulB);
            this._foundPoints.unshift(ful);

            //debug
            // this._drawPoint(vec2(ful), {
            //     color: '#0cc'
            // });

            //3点見つかったのでsimplex（単体）による判定へ
            if (this._checkCenterInTriangle()) {
                this._contact();
            }
            else {
                this._nocontact();
            }
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Contact      = Contact;
    ns.ContactPoint = ContactPoint;
 
}(Phys2D));
