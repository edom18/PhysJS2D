var Phys2D = {};

(function (exports) {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight;

    var DEG_TO_RAD = Math.PI / 180;

    function nullFunction() {
        //null
    }

    /**
     * 座標を直交座標に直す
     *
     * @param {number} x
     * @param {number} y
     */
    function convertPoint(x, y) {

        var ret = vec2(0.0);

        ret.x = x - w / 2;
        ret.y = h - (h / 2 + y);

        return ret;
    }

    var Object2D = Class.extend({
        init: function () {
            this.matrix   = mat3();
            this.position = mat3();
            this.rotation = mat3();
            this._scale   = mat3();
            this.vertices = [];
        },

        draw  : nullFunction,
        update: nullFunction,

        /**
         * @return {Array.<vec2>}
         */
        getVertices: function () {
            var vertices = this.vertices;
            var matrix = this.matrix;
            var ret = [];

            for (var i = 0, l = vertices.length; i < l; i++) {
                ret.push(vec2.applyMatrix3(vertices[i], matrix));
            }

            return ret;
        },

        /**
         * Translate object.
         * @param {vec2} vec
         */
        translate: function (vec) {
            var temp = mat3.translate(vec);
            this.position = mat3.multiply(this.position, temp);

            temp = mat3.multiply(this.rotation, this.position);
            temp = mat3.multiply(temp, this._scale);
            this.matrix = temp;
        },

        /**
         * Rotate object.
         * @param {number} deg
         */
        rotate: function (deg) {
            var temp = mat3.rotate(deg * DEG_TO_RAD);
            this.rotation = mat3.multiply(this.rotation, temp);

            temp = mat3.multiply(this.rotation, this.position);
            temp = mat3.multiply(temp, this._scale);
            this.matrix = temp;
        },

        /**
         * Scaled object.
         * @param {vec2} scale
         */
        scale: function (scale) {
            var temp = mat3.scale(scale);
            this._scale = mat3.multiply(this._scale, temp);

            temp = mat3.multiply(this.rotation, this.position);
            temp = mat3.multiply(temp, this._scale);
            this.matrix = temp;
        },

        /**
         * Set a color to a object.
         * @param {string} color
         */
        setColor: function (color) {
            this._color = color;
        }
    });


    var Line = Object2D.extend({
        init: function (start, end, opt) {

            opt || (opt = {});

            this._start = start;
            this._end = end;
            this._color = opt.color || 'black';
        },
        draw: function (ctx, center) {
            ctx.save();
            ctx.strokeStyle = this._color;
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.moveTo(this._start.x, -this._start.y);
            ctx.lineTo(this._end.x, -this._end.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    });

    var Point = Object2D.extend({
        init: function (pos, opt) {

            opt || (opt = {});

            this._pos = pos;
            this._radius = opt.radius || 5;
            this._color = opt.color || 'black';
        },
        draw: function (ctx, center) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.arc(this._pos.x, -this._pos.y, this._radius, Math.PI * 2, false);
            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }
    });

    /**
     * 三角形クラス
     *
     * @class
     * @param {vec2} v1
     * @param {vec2} v2
     * @param {vec2} v3
     * @param {number} mass
     */
    var Triangle = Object2D.extend({
        init: function (v1, v2, v3, opt) {

            opt || (opt = {});

            this._super();

            this.mass   = opt.mass || 1;
            this._color = opt.color || 'black';
            this.angularAcc = 0;
            this.angularVelocity = 0;
            this.angle = 0;
            this._originalVertices = [vec2(v1), vec2(v2), vec2(v3)];
            this.vertices = [v1, v2, v3];
            this.calcInertia();
            this._calcCenter();

            if (opt.useCenter) {
                this.position = mat3.translate(vec2.minus(this._center));
            }
        },

        /**
         * 重心を求める
         * CoG = 1 / 3(v1 + v2 + v3);
         */
        _calcCenter: function () {

            var model = this.matrix;
            var v0 = vec2.applyMatrix3(this.vertices[0], model);
            var v1 = vec2.applyMatrix3(this.vertices[1], model);
            var v2 = vec2.applyMatrix3(this.vertices[2], model);

            var center = vec2.add(v0, v1);
            center = vec2.add(center, v2);
            center = vec2.multiplyScalar(center, 1 / 3);

            this._center = center;
        },

        /**
         * @return {vec2}
         */
        getCenter: function () {
            return vec2.applyMatrix3(this._center, this.matrix);
        },
        
        /**
         * 重心の慣性テンソルを計算
         * 
         * I = 1/18m(|v_1|^2 + |v_2|^2 + |v_3|^2 - v_2・v_3 - v_3・v_1 - v_1・v_2)
         *
         */
        calcInertia: function () {
            var v1 = this.vertices[0];
            var v2 = this.vertices[1];
            var v3 = this.vertices[2];
            
            var v1len = vec2.lengthSqr(v1);
            var v2len = vec2.lengthSqr(v2);
            var v3len = vec2.lengthSqr(v3);
            var v2v3 = vec2.dot(v2, v3);
            var v3v1 = vec2.dot(v3, v1);
            var v1v2 = vec2.dot(v1, v2);

            var I = (1 / 18) * this.mass * (v1len + v2len + v3len - v2v3 - v3v1 - v1v2);

            this.inertia = I;
        },

        /**
         * 設定をリセットする
         */
        reset: function () {
            this.angularVelocity = 0;
            this.angle = 0;
            this.angularAcc = 0;
            this.calcInertia();
        },

        /**
         * レンダリング
         */
        draw: function (ctx, center) {
            var model = this.matrix;

            var vertices = this.vertices;
            var v0 = vec2(vertices[0]);
            var v1 = vec2(vertices[1]);
            var v2 = vec2(vertices[2]);

            v0 = vec2.applyMatrix3(v0, model);
            v1 = vec2.applyMatrix3(v1, model);
            v2 = vec2.applyMatrix3(v2, model);

            ctx.save();
            ctx.beginPath();
            ctx.translate(center.x, center.y);
            ctx.moveTo(v0.x, -v0.y);
            ctx.lineTo(v1.x, -v1.y);
            ctx.lineTo(v2.x, -v2.y);
            ctx.fillStyle = this._color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        },

        /**
         * 座標位置をアップデート
         */
        update: function () {
            this.angularAcc *= 0.5;
            this.angularVelocity += this.angularAcc;
            this.angle += this.angularVelocity;
            this.rotate(this.angularVelocity);
        }
    });


    /**
     * Scene class
     * @class
     */
    var Scene = Class.extend({
        init:function () {
            this.objects = [];
        },
        length: function () {
            return this.objects.length;
        },
        add: function (obj2d) {
            this.objects.push(obj2d);
        },
        //TODO
        remove: function (obj2d) {

        },
        clear: function () {
            this.objects = [];
        }
    });

    /**
     * Renderer
     * @class
     */
    var Renderer = Class.extend({
        init: function (cv) {
            this._cv  = cv;
            this._ctx = cv.getContext('2d');
            this._center = {
                x: cv.width / 2,
                y: cv.height / 2
            };
        },
        update: function (scene) {
            for (var i = 0, l = scene.length(); i < l; i++) {
                scene.objects[i].update();
            }
        },
        render: function (scene) {
            var ctx = this._ctx;
            var center = this._center;

            this.update(scene);

            for (var i = 0, l = scene.length(); i < l; i++) {
                scene.objects[i].draw(ctx, center);
            }
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
            var objAVert = this._objA.getVertices();
            var objBVert = this._objB.getVertices();
            var points   = this._foundPoints;
            var supportA, supportB,
                ful, fulA, fulB;

            // debugger;
            this._drawTriangle(this._foundPoints[0], this._foundPoints[1], this._foundPoints[2], {
                color: 'rgba(255, 255, 255, 0.2)'
            });

            //エラー回避の応急処置
            this._count++;
            if (this._count > 10) {
                console.log('overflow');
                return;
            }

            //三角形内に原点があった場合は衝突している
            if (this._isContact()) {
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
            supportA = vec2.sub(originPos, nearPoint);
            supportA = vec2.normalize(supportA);
            supportB = vec2.minus(supportA);

            fulA = this._support(supportA, objAVert);
            fulB = this._support(supportB, objBVert);

            //debug
            // this._drawPoint(fulA, {
            //     color: '#eee'
            // });
            // this._drawPoint(fulB, {
            //     color: '#eee'
            // });

            //支点
            ful = vec2.sub(fulA, fulB);

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
                objAVert = this._objA.getVertices(),
                objBVert = this._objB.getVertices(),
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

            this._drawPoint(vec2(fulA), {
               color: '#999'
            });
            this._drawPoint(vec2(fulB), {
               color: '#999'
            });

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
 
        
    /**
     * 線分と点との最短点を検出する
     * @param {vec2} e0 端点0
     * @param {vec2} e1 端点1
     * @param {vec2} p  判別したい点
     * @return {vec2} 検出した最短点の位置
     */
    function detectPointOnLine(e0, e1, p) {

        //端点0〜1のベクトル
        var vec = vec2.sub(e1, e0);

        //上記で求めたベクトルの長さ
        var a = vec2.lengthSqr(vec);

        //端点0から点までのベクトル
        var e0p = vec2.sub(e0, p);

        //aが0の場合は、e0 == e1、つまり「点」になるので
        //点と点の距離、つまり端点e0が最短点
        if (a === 0) {
            return vec2(e0);
        }

        var b = vec.x * (e0.x - p.x) + vec.y * (e0.y - p.y);

        //a : bの係数を計算
        var t = -(b / a);

        //0.0〜1.0にクランプする
        t = Math.min(1.0, Math.max(t, 0.0));

        //求まった係数 t を元に、垂線の足の位置を計算
        var x = t * vec.x + e0.x;
        var y = t * vec.y + e0.y;

        //垂線の足の位置ベクトルを返す
        return vec2(x, y);
    }

    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    exports.convertPoint = convertPoint;
    exports.Object2D = Object2D;
    exports.Point    = Point;
    exports.Line     = Line;
    exports.Triangle = Triangle;
    exports.Scene    = Scene;
    exports.Renderer = Renderer;
    exports.Contact  = Contact;
    exports.detectPointOnLine = detectPointOnLine;

}(Phys2D));

(function () {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight,
        hw = w / 2,
        hh = h / 2;

    var cv, ctx;

    document.addEventListener('DOMContentLoaded', function () {

        cv = document.querySelector('#cv');
        cv.width  = w;
        cv.height = h;
        ctx = cv.getContext('2d');

        var scene = new Phys2D.Scene();
        var renderer = new Phys2D.Renderer(cv);

        var v1 = vec2(-200.0, 210.5);
        var v2 = vec2( 115.0, 310.0);
        var v3 = vec2( 150.0, 115.5);

        var v4 = vec2(  5.0, 100.5);
        var v5 = vec2(295.0, 155.5);
        var v6 = vec2(170.0,  30.0);

        var triangle1 = new Phys2D.Triangle(v1, v2, v3, {
            color: 'red',
            mass: 5
        });
        //triangle1.translate(vec2(70, -300));
        triangle1.translate(vec2(3, -121));
        scene.add(triangle1);

        var triangle2 = new Phys2D.Triangle(v4, v5, v6, {
            color: 'blue',
            mass: 5,
            useCenter: true
        });
        scene.add(triangle2);

        var baseLine1 = new Phys2D.Line(vec2(-hw, 0), vec2(hw, 0), {
            color: '#aaa'
        });
        scene.add(baseLine1);

        var baseLine2 = new Phys2D.Line(vec2(0, hh), vec2(0, -hh), {
            color: '#aaa'
        });
        scene.add(baseLine2);
        
        //レンダリングループ
        (function loop() {
            requestAnimationFrame(loop);
            ctx.clearRect(0, 0, w, h);
            renderer.render(scene);
        }());

        //衝突判定
        {
            var prevX = 0;
            var prevY = 0;
            var dragging = false;

            cv.addEventListener('mousedown', function (e) {
                prevX = e.pageX;
                prevY = e.pageY;
                dragging = true;
            }, false)

            document.addEventListener('mouseup', function (e) {
                dragging = false;

                // console.log(triangle1.position);

                // var contact = new Phys2D.Contact(triangle1, triangle2, {
                //     renderer: renderer,
                //     scene: scene,
                //     contact: function () {
                //         triangle1.setColor('gray');
                //     },
                //     nocontact: function () {
                //         triangle1.setColor('red');
                //     }
                // });
            }, false)

            document.addEventListener('mousemove', function (e) {
                if (!dragging) {
                    return;
                }
                prevX = e.pageX - prevX;
                prevY = e.pageY - prevY;

                triangle1.translate(vec2(prevX, -prevY));
                var contact = new Phys2D.Contact(triangle1, triangle2, {
                    renderer: renderer,
                    scene: scene,
                    contact: function () {
                        triangle1.setColor('gray');
                    },
                    nocontact: function () {
                        triangle1.setColor('red');
                    }
                });

                prevX = e.pageX;
                prevY = e.pageY;
            }, false)
        }
    }, false);
}());
