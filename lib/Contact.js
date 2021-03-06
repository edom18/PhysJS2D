(function (ns) {

    var DEBUG = false;

    /**
     * ふたつの物体の詳細衝突判定を行う
     * @class
     * @param {Object2D} objA
     * @param {Object2D} objB
     */
    var Contact = Class.extend({
        $class: 'Contact',
        init: function (objA, objB) {
            this._objA = objA;
            this._objB = objB;
            this._foundPoints = [];
            this._originPos = vec2(ns.EPSILON);

            this._objAVert = this._objA.getVertices();
            this._objBVert = this._objB.getVertices();

            //応急処置
            // this._count = 0;
        },

        /**
         * For debug.
         */
        _render: function () {
            renderer.render(scene);
        },
        _drawPoint: function (v, opt) {
            if (!DEBUG) {
                return;
            }

            var p = new ns.Point(v, opt);
            scene.add(p);
            this._render();
        },
        _drawLine: function (v1, v2, opt) {
            if (!DEBUG) {
                return;
            }

            var l = new ns.Line(v1, v2, opt);
            scene.add(l);
            this._render();
        },
        _drawTriangle: function (v1, v2, v3, opt) {
            if (!DEBUG) {
                return;
            }

            var t = new ns.Triangle(v1, v2, v3, opt);
            scene.add(t);
            this._render();
        },

        /**
         * ふたつの三角形同士の最近接点を求める
         * @param {vec2} depthPoint
         */
        _calcNearPointTriangle: function (depthPoint) {

            //いったん、最近接点を求めるため、衝突法線方向+αに移動
            var pointA = null,
                pointB = null,
                normal = vec2.normalize(depthPoint),
                amount = vec2.norm(depthPoint) * ns.MOVE_NORMAL,
                detectPointOnLine = ns.detectPointOnLine;

            //めり込み量より少し多くなるようベクトルを拡張
            normal = vec2.multiplyScalar(normal, amount);

            //一旦、めり込まない状態を作り出す状態まで移動する
            this._objB.translate(normal);

            {
                var matrixA = this._objA.matrix;
                var matrixB = this._objB.matrix;
                var matrixAInv = mat3.inverse(matrixA);
                var matrixBInv = mat3.inverse(matrixB);
                var collidersA = this._objA.getColliders();
                var collidersB = this._objB.getColliders();
                var contactPoint = null;
                var minLen = Number.MAX_VALUE;
                var p = null;
                var len = 0;

                //移動後、三角形同士の最接近点を求める
                for (var i = 0, l = collidersA.length; i < l; i++) {
                    for (var j = 0, k = collidersB.length; j < k; j++) {

                        var verticesA = collidersA[i].getVerticesByMatrix(matrixA);
                        var verticesB = collidersB[j].getVerticesByMatrix(matrixB);

                        //物体Bの各頂点と、物体Aの各辺との最短点を求める
                        for (var vi = 0, vl = verticesB.length; vi < vl; vi++) {
                            for (var vj = 0, vk = verticesA.length; vj < vk; vj++) {
                                p = detectPointOnLine(verticesA[vj], verticesA[(vj + 1) % 3], verticesB[vi]);

                                //求まった点と頂点との距離を算出
                                len = vec2.norm(vec2.sub(p, verticesB[vi]));

                                if (minLen > len) {
                                    minLen = len;
                                    contactPoint = p;
                                    pointA = vec2.applyMatrix3(p, matrixAInv);
                                    pointB = vec2.applyMatrix3(verticesB[vi], matrixBInv);
                                }
                            }
                        }

                        //物体Aの各頂点と、物体Bの各辺との最短点を求める
                        for (var vi = 0, vl = verticesA.length; vi < vl; vi++) {
                            for (var vj = 0, vk = verticesB.length; vj < vk; vj++) {
                                p = detectPointOnLine(verticesB[vj], verticesB[(vj + 1) % 3], verticesA[vi]);

                                //求まった点と頂点との距離を算出
                                len = vec2.norm(vec2.sub(p, verticesA[vi]));

                                if (minLen > len) {
                                    minLen = len;
                                    contactPoint = p;
                                    pointA = vec2.applyMatrix3(verticesA[vi], matrixAInv);
                                    pointB = vec2.applyMatrix3(p, matrixBInv);
                                }
                            }
                        }
                    }
                }
            }

            //移動した分を元に戻す
            this._objB.translate(vec2.minus(normal));

            return {
                contactPoint: contactPoint,
                pointA: pointA,
                pointB: pointB
            };
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
                // that._drawLine(points[points.length - 1], points[0], {
                //     color: '#fff'
                // });
                // that._drawPoint(result, {
                //     color: '#c00'
                // });

                //残りの辺すべてをチェック
                for (var i = 1, l = points.length; i < l; i++) {
                    nearPoint = detectPointOnLine(points[i - 1], points[i], originPos);

                    len  = vec2.norm(vec2.sub(nearPoint, originPos));

                    if (distance > len) {
                        distance = len;
                        result = nearPoint;

                        // that._drawPoint(result, {
                        //     color: '#c00'
                        // });
                    }
                }

                return result;
            }

            var support   = null;
            var newPoint  = null;
            var nearPoint = null;
            var nearest   = null;

            // debugger;

            //ミンコフスキ差凸包上の、原点からの最接近点を求める
            while (!nearest) {

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
                        nearest = newPoint;
                        break;
                    }
                }

                //収束していなかった場合は追加してループ
                if (!nearest) {
                    points.unshift(newPoint);

                    var vec, dot, theta;

                    //一番下にある点を探す
                    var temp = [];
                    var minY = Number.MAX_VALUE;
                    var index = -1;
                    for (var i = 0, l = points.length; i < l; i++) {
                        if (minY > points[i].y) {
                            minY = points[i].y;
                            index = i;
                        }
                    }

                    //debug
                    // this._drawPoint(points[index], {
                    //     color: 'rgba(255, 0, 0, 0.2)'
                    // });

                    for (var i = 0, l = points.length; i < l; i++) {
                        if (index === i) {
                            continue;
                        }

                        vec   = vec2.sub(points[i], points[index]);

                        //debug
                        // this._drawPoint(points[i], {
                        //     color: 'rgba(255, 0, 0, 0.2)'
                        // });

                        dot   = vec2.dot(vec2.right, vec);
                        theta = dot / vec2.norm(vec);

                        temp.push({
                            theta: theta,
                            point: points[i]
                        });
                    }

                    temp.sort(function (a, b) {
                        return b.theta - a.theta;
                    });

                    points = [points[index]];
                    for (var i = 0, l = temp.length; i < l; i++) {
                        points.push(temp[i].point);
                    }

                    //debug
                    // for (var i = 0, l = points.length; i < l; i++) {
                    //     this._drawPoint(points[i], {
                    //         color: 'rgba(255, 255, 255, 0.3)'
                    //     });
                    // }
                }
            }

            //得られた多角形から最短距離を算出
            var depth = Number.MAX_VALUE;
            var depthPoint = null;
            for (var i = 0, l = points.length; i < l; i++) {
                var len = vec2.lengthSqr(vec2.sub(points[i], originPos));
                if (depth > len) {
                    depth = len;
                    depthPoint = points[i];
                }
            }

            var p = detectPointOnLine(points[points.length - 1], points[0], originPos);
            var len = vec2.lengthSqr(p);
            if (depth > len) {
                depth = len;
                depthPoint = p;
            }

            //残りの辺すべてをチェック
            for (var i = 1, l = points.length; i < l; i++) {
                var p = detectPointOnLine(points[i - 1], points[i], originPos);
                var len = vec2.lengthSqr(p);
                if (depth > len) {
                    depth = len;
                    depthPoint = p;
                }
            }

            //debug
            // this._drawPoint(depthPoint, {
            //     color: 'yellow'
            // });

            // debugger;
            //ふたつの三角形同士の最近接点を求める
            var contactPointInfo = this._calcNearPointTriangle(depthPoint);

            return  new ns.ContactPoint(
                        depthPoint,
                        contactPointInfo.contactPoint,
                        contactPointInfo.pointA,
                        contactPointInfo.pointB
                    );
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

            // ミンコフスキ「差」のため、差分を返す
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

            var originPos   = this._originPos;
            var foundPoints = this._foundPoints;
            var nearPoint0 = Phys2D.detectPointOnLine(foundPoints[0], foundPoints[1], originPos);
            var nearPoint1 = Phys2D.detectPointOnLine(foundPoints[0], foundPoints[2], originPos);

            return (vec2.norm(nearPoint0) < vec2.norm(nearPoint1)) ? nearPoint0 : nearPoint1;
        },


        /**
         * 原点が、得られた三角形内に存在するかをチェック
         * また、再帰的に新しい三角形を作成し、新しいポイントが得られなくなるまで繰り返す
         */
        _checkCenterInTriangle: function () {

            // debugger;
            
            //TODO 応急処置用カウンタ
            // this._count++;

            var originPos = this._originPos,
                support   = null,
                ful       = null,
                foundPoints = this._foundPoints,

                nearPoint0 = null,
                nearPoint1 = null,
                nearPoint2 = null,

                length0 = 0,
                length1 = 0,
                length2 = 0,
                
                nearestPoint = null;

            //debug
            // this._drawTriangle(foundPoints[0], foundPoints[1], foundPoints[2], {
            //     nocenter: true,
            //     color: 'rgba(255, 255, 255, 0.2)'
            // });

            //三角形内に原点があった場合は衝突している
            if (this._isContact()) {
                var contactPoint = this._calcPenetrationDepth();
                return contactPoint;
            }

            //求まった3点からできる三角形と原点との最短点を見つける
            nearPoint0 = ns.detectPointOnLine(foundPoints[0], foundPoints[1], originPos);
            nearPoint1 = ns.detectPointOnLine(foundPoints[0], foundPoints[2], originPos);
            nearPoint2 = ns.detectPointOnLine(foundPoints[1], foundPoints[2], originPos);

            //debug
            // this._drawPoint(nearPoint0, {
            //     color: 'red'
            // });
            // this._drawPoint(nearPoint1, {
            //     color: 'red'
            // });
            // this._drawPoint(nearPoint2, {
            //     color: 'red'
            // });

            length0 = vec2.lengthSqr(nearPoint0);
            length1 = vec2.lengthSqr(nearPoint1);
            length2 = vec2.lengthSqr(nearPoint2);

            //すべての最接近点が同じ場合は接触していないので終了する
            if (length0 === length1 && length0 === length2) {
                // debugger;
                return null;
            }
            //nearPoint0が近い場合は、それを形成する線分に絞る
            else if (length0 <= length1 && length0 <= length2) {
                nearestPoint = nearPoint0;

                this._foundPoints = [
                    foundPoints[0],
                    foundPoints[1]
                ];
            }
            //nearPoint1の場合
            else if (length1 <= length0 && length1 <= length2) {
                nearestPoint = nearPoint1;

                this._foundPoints = [
                    foundPoints[0],
                    foundPoints[2]
                ];
            }
            //nearpoint2の場合
            else if (length2 <= length0 && length2 <= length1) {
                nearestPoint = nearPoint2;

                this._foundPoints = [
                    foundPoints[1],
                    foundPoints[2]
                ];
            }

            //参照を渡し直す
            foundPoints = this._foundPoints;

            //debug
            // this._drawPoint(nearestPoint, {
            //     color: '#009'
            // });
            // this._drawLine(originPos, nearestPoint, {
            //     color: '#009'
            // });

            //求まった点と原点を結んだベクトルのサポート写像を求める
            support = vec2.sub(originPos, nearestPoint);
            ful = this._getMinkowskiSupport(support);

            //debug
            // this._drawPoint(ful, {
            //     color: '#e00'
            // });

            //三角形の中に原点が見つからず、
            //かつ検出できる支点がなくなった場合は衝突していない
            for (var i = 0, l = foundPoints.length; i < l; i++) {
                if (vec2.equal(ful, foundPoints[i])) {
                    return null;
                }
            }

            foundPoints.unshift(ful);

            //応急処置
            // if (this._count > 10) {
            //     //ここにきたら処理がおかしい
            //     debugger;
            //     return false;
            // }

            return this._checkCenterInTriangle();
        },

        detect: function () {
            var contactType = this._objA.shapeType | this._objB.shapeType;
            if (contactType === ns.contactType.convexconvex) {
                return this._detectConvexConvex();
            }
            else if (contactType === ns.contactType.circleconvex) {
                return this._detectCircleConvex();
            }
            else if (contactType === ns.contactType.circlecircle) {
                return this._detectCircleCircle();
            }
        },

        /**
         * 円同士の衝突検出
         */
        _detectCircleCircle: function () {
            var circleACenter = this._objA.getCenter();
            var circleBCenter = this._objB.getCenter();

            var matrixAInv = mat3.inverse(this._objA.matrix);
            var matrixBInv = mat3.inverse(this._objB.matrix);

            var delta = vec2.sub(circleBCenter, circleACenter);
            var distance = this._objA.radius + this._objB.radius;
            var len = vec2.norm(delta);

            if (len > distance) {
                return null;
            }

            var normal = vec2.normalize(delta);
            var depthPoint = vec2.multiplyScalar(normal, distance - len);
            var contactPoint = vec2.multiplyScalar(normal, this._objB.radius);
            contactPoint = vec2.add(contactPoint, circleBCenter);

            var pointA = vec2.applyMatrix3(contactPoint, matrixAInv);
            var pointB = vec2.applyMatrix3(contactPoint, matrixBInv);

            return  new ns.ContactPoint(depthPoint, contactPoint, pointA, pointB);
        },

        /**
         * 多面体と円との衝突検出
         */
        _detectCircleConvex: function () {
            var detectPointOnLine = ns.detectPointOnLine;

            var circle = this._objA.shapeType === ns.shapeType.circleShapeBit ? this._objA : this._objB;
            var convex = this._objA.shapeType === ns.shapeType.polygonShapeBit ? this._objA : this._objB
            var circleCenter = circle.getCenter();
            var vertices = convex.getVertices();
            var matrixCircleInv = mat3.inverse(circle.matrix);
            var matrixConvexInv = mat3.inverse(convex.matrix);

            var minLen = Number.MAX_VALUE;
            var p = null;
            var len = 0;

            var pointA, pointB;
            var contactPoint, depthPoint;

            //各頂点と線分との距離を計る
            {

                for (var i = 0, l = vertices.length; i < l; i++) {
                    p = detectPointOnLine(vertices[i], vertices[(i + 1) % l], circleCenter);

                    //求まった点と中心点との距離を算出
                    len = vec2.norm(vec2.sub(p, circleCenter));

                    if (minLen > len) {
                        minLen = len;
                        contactPoint = p;
                    }
                }
            }

            //もし衝突していなければnullを返す
            if (minLen > circle.radius) {
                return null;
            }

            //求まった点を元に、貫通深度を求める
            {
                var delta = vec2.sub(contactPoint, circleCenter);
                var radiusVec = vec2.normalize(delta);

                //衝突方向の法線を、半径分伸ばす
                radiusVec = vec2.multiplyScalar(radiusVec, circle.radius);
                radiusVec = vec2.add(radiusVec, circleCenter);

                //上記から衝突点を引き、貫通深度を得る
                //衝突判定のオブジェクトの順番に応じて法線の向きを変える
                if (circle === this._objA) {
                    depthPoint = vec2.sub(radiusVec, contactPoint);
                }
                else {
                    depthPoint = vec2.sub(contactPoint, radiusVec);
                }
            }

            var circlePoint = vec2.applyMatrix3(radiusVec, matrixCircleInv);
            var convexPoint = vec2.applyMatrix3(contactPoint, matrixConvexInv);

            if (circle === this._objA) {
                pointA = circlePoint;
                pointB = convexPoint;
            }
            else {
                pointA = convexPoint;
                pointB = circlePoint;
            }

            return  new ns.ContactPoint(depthPoint, contactPoint, pointA, pointB);
        },

        /**
         * 多面体同士の衝突検出
         */
        _detectConvexConvex: function () {

            // debugger;
            var originPos = this._originPos,
                support,
                ful,
                
                foundPoints = this._foundPoints;

            //objAの中心点から原点へのベクトルによる支点を求める
            support = vec2.sub(originPos, this._objA.getCenter());

            //debug
            // this._drawLine(originPos, this._objA.getCenter());
            // this._drawPoint(vec2(support), {
            //    color: 'yellow'
            // });

            //支点1
            ful = this._getMinkowskiSupport(support);
            foundPoints.unshift(ful);

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
            foundPoints.unshift(ful);

            //debug
            // this._drawPoint(vec2(ful), {
            //    color: 'yellow'
            // });

            //もし同じ点が求まった場合は収束したとして非衝突状態
            if (vec2.equal(foundPoints[0], foundPoints[1])) {
                return false;
            }

            //求まった2つの点で作られる線分の最接近点を求める
            var nearPoint = Phys2D.detectPointOnLine(foundPoints[1], foundPoints[0], originPos);

            //debug
            // this._drawLine(foundPoints[1], foundPoints[0]);
            // this._drawPoint(vec2(nearPoint), {
            //     color: '#00c'
            // });

            //求まった点と原点を結んだベクトルのサポート写像を求める
            support = vec2.sub(originPos, nearPoint);

            //支点3
            ful = this._getMinkowskiSupport(support);
            foundPoints.unshift(ful);

            //debug
            // this._drawLine(originPos, nearPoint);
            // this._drawPoint(vec2(ful), {
            //     color: '#0cc'
            // });

            //3点見つかったのでsimplex（単体）による判定へ
            return this._checkCenterInTriangle();
        }
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Contact      = Contact;
 
}(Phys2D));
