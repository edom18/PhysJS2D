var Phys2D = {};

(function (exports) {

    'use strict';

    var w = window.innerWidth,
        h = window.innerHeight;

    var min = Math.min,
        max = Math.max;

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

    /**
     * クランプ処理
     * @param {number} minValue
     * @param {number} maxValue
     * @param {number} value
     */
    function clamp(minValue, maxValue, value) {
        return min(maxValue, max(minValue, value));
    }
        
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
    exports.clamp = clamp;
    exports.detectPointOnLine = detectPointOnLine;
    exports.EPSILON = 1e-5;
    exports.nullFunction     = function () {};
    exports.abstractFunction = function () { throw new Error('MUST BE IMPLEMENTED.'); };
    exports.shapeType = {
        polygonShapeBit: 1,
        circleShapeBit: 2
    };
    exports.contactType = {
        convexconvex: 1,
        circlecircle: 2,
        circleconvex: 3
    };

}(Phys2D));
