var cv, ctx, w, h;

/**
 * 座標を直交座標に直す
 *
 * @param {vec2} v
 */
function convertPoint(v) {
    return vec2(v.x, -v.y);
}

/**
 * 三角形クラス
 *
 * @class
 * @param {vec2} v1
 * @param {vec2} v2
 * @param {vec2} v3
 * @param {number} mass
 */
function Triangle(v1, v2, v3, mass) {
    this.mass = mass || 1;
    this.angularAcc = 0;
    this.angularVelocity = 0;
    this.position = mat4();
    this.angle = 0;
    
    v1 = convertPoint(v1);
    v2 = convertPoint(v2);
    v3 = convertPoint(v3);
    
    this._vertecies = [v1, v2, v3];
    this.calcInertia();
    this._calcCenter();
}

Triangle.prototype = {
    constructor: Triangle,

    /**
     * 重心を求め、原点に合わせる
     * CoG = 1 / 3(v1 + v2 + v3);
     */
    _calcCenter: function () {
        var v1 = this._vertecies[0];
        var v2 = this._vertecies[1];
        var v3 = this._vertecies[2];

        var center = vec2.add(v1, v2);
        center = vec2.add(center, v3);
        center = vec2.multiplyScalar(center, 1 / 3);

        this._center = center;

        v1.x -= center.x;
        v1.y -= center.y;
        v2.x -= center.x;
        v2.y -= center.y;
        v3.x -= center.x;
        v3.y -= center.y;
    },
    
    /**
     * 重心の慣性テンソルを計算
     * 
     * I = 1/18m(|v_1|^2 + |v_2|^2 + |v_3|^2 - v_2・v_3 - v_3・v_1 - v_1・v_2)
     *
     */
    calcInertia: function () {
        var v1 = this._vertecies[0];
        var v2 = this._vertecies[1];
        var v3 = this._vertecies[2];
        
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
    draw: function () {
        var pos = this.position;
        var rot = quat.rotate(this.angle, vec3(0, 0, 1));
        var model = quat.toMat(rot);

        var mvpMatrix = mat4.multiply(model, pos);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(this.angle);
        ctx.moveTo(this._vertecies[0].x, this._vertecies[0].y);
        ctx.lineTo(this._vertecies[1].x, this._vertecies[1].y);
        ctx.lineTo(this._vertecies[2].x, this._vertecies[2].y);
        ctx.fill();
        ctx.restore();
    },

    /**
     * 座標位置をアップデート
     */
    update: function () {
        this.angularAcc *= 0.5;
        this.angularVelocity += this.angularAcc;
        this.angle += this.angularVelocity;
    }
};

$(function () {
    cv = $('#cv')[0];
    ctx = cv.getContext('2d');
    w = cv.width;
    h = cv.height;

    var $mass = $('#mass');
    $mass.on('change', function (e) {
        triangle.mass = +$(this).val();
        triangle.reset();
    });

    var mass = +$mass.val();
    
    var v1 = vec2(-10, -10);
    var v2 = vec2(30, 100);
    var v3 = vec2(100, 20);
    
    //三角形をひとつ作る
    var triangle = new Triangle(v1, v2, v3, mass);

    //レンダリングループ
    (function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, w, h);
        drawBase();
        triangle.update();
        triangle.draw();

        if (dragging) {
            drawLine(startPos, currentPos);
        }
    }());


    var dragging = false;
    var startPos = vec2(0);
    var endPos   = vec2(0);
    var currentPos = vec2(0);

    cv.addEventListener('mousedown', function (e) {
        dragging = true;
        startPos = vec2(e.pageX, e.pageY);
        startPos.x -= w / 2;
        startPos.y  = h - (h / 2 + startPos.y);

        currentPos = vec2(startPos);
    }, false);

    document.addEventListener('mousemove', function (e) {
        if (!dragging) {
            return;
        }

        currentPos = vec2(e.pageX, e.pageY);
        currentPos.x -= w / 2;
        currentPos.y  = h - (h / 2 + currentPos.y);
    }, false);

    document.addEventListener('mouseup', function (e) {
        if (!dragging) {
            return;
        }
        dragging = false;
        endPos = vec2(e.pageX, e.pageY);
        endPos.x -= w / 2;
        endPos.y  = h - (h / 2 + endPos.y);
        var f = vec2.sub(endPos, startPos);
        var r = startPos;

        var t = vec2.cross(r, f);
        var a = t / triangle.inertia;

        triangle.angularAcc -= a;
    }, false);

    function drawLine(start, end) {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.translate(w / 2, h / 2);
        ctx.moveTo(start.x, -start.y);
        ctx.lineTo(end.x, -end.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    
    //直交座標用のラインを引く
    function drawBase() {
        ctx.save();
        ctx.strokeStyle = '#999';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.restore();
    }
});
