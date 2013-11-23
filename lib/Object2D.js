(function (ns) {

    'use strict';

    var DEG_TO_RAD = Math.PI / 180,
        xAxis = vec2.right,
        yAxis = vec2.up;


    function nullFunction() { /* null */ }

    function sortFunc(a, b) {
        return a - b;
    }

    /**
     * Object2D
     * Phys2Dのベースオブジェクト
     * @class
     */
    var Object2D = Class.extend({
        init: function () {
            this.matrix   = mat3();
            this.position = vec2(0.0);
            this.rotation = 0;
            this.scaling  = vec2(1.0);

            this.translateMatrix = mat3();
            this.rotationMatrix = mat3();
            this.scaleMatrix = mat3();

            this.vertices = [];
            this.AABB = {
                minX: 0, maxX: 0,
                minY: 0, maxY: 0
            };
        },

        draw  : nullFunction,
        update: nullFunction,

        //現在の頂点情報から、AABBの情報を得る
        getAABB: function () {

            var vertices = this.getVertices();
            var dot;
            var temp = [];

            //X軸のmin, maxを得る
            for (var i = 0, l = vertices.length; i < l; i++) {
                temp.push(vec2.dot(xAxis, vertices[i]));
            }

            temp.sort(sortFunc);
            this.AABB.minX = temp[0] * 1.1;
            this.AABB.maxX = temp[vertices.length - 1] * 1.1;

            //Y軸のmin, maxを得る
            temp = [];
            for (var i = 0, l = vertices.length; i < l; i++) {
                temp.push(vec2.dot(yAxis, vertices[i]));
            }

            temp.sort(sortFunc);
            this.AABB.minY = temp[0] * 1.1;
            this.AABB.maxY = temp[vertices.length - 1] * 1.1;

            return this.AABB;
        },

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
            this.position = vec2.add(this.position, vec);
            this.translateMatrix = mat3.translate(this.position);

            this.matrix = mat3.multiply(this.translateMatrix, this.rotationMatrix);
            this.matrix = mat3.multiply(this.matrix, this.scaleMatrix);
        },

        /**
         * Rotate object.
         * @param {number} deg
         */
        rotate: function (deg) {
            this.rotation += deg * DEG_TO_RAD;
            this.rotationMatrix = mat3.rotate(this.rotation);

            this.matrix = mat3.multiply(this.translateMatrix, this.rotationMatrix);
            this.matrix = mat3.multiply(this.matrix, this.scaleMatrix);
        },

        /**
         * Scaled object.
         * @param {vec2} scale
         */
        scale: function (scale) {
            this.scaling = vec2.multiply(this.scaling, scale);
            this.scaleMatrix = mat3.scale(this.scaling);

            this.matrix = mat3.multiply(this.translateMatrix, this.rotationMatrix);
            this.matrix = mat3.multiply(this.matrix, this.scaleMatrix);
        },

        /**
         * Set a color to a object.
         * @param {string} color
         */
        setColor: function (color) {
            this._color = color;
        }
    });


    /*! ---------------------------------------------------------
        EXPORTS
    ------------------------------------------------------------- */
    ns.Object2D = Object2D;

}(Phys2D));
