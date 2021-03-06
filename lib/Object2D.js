(function (ns) {

    'use strict';

    var DEG_TO_RAD = Math.PI / 180,

        abs = Math.abs,

        LINEAR_VELOCITY_TOLERANCE  = ns.LINEAR_VELOCITY_TOLERANCE,
        ANGULAR_VELOCITY_TOLERANCE = ns.ANGULAR_VELOCITY_TOLERANCE;


    function nullFunction() { /* null */ }

    /**
     * Object2D
     * Phys2Dのベースオブジェクト
     * @class
     */
    var Object2D = Class.extend({
        $class: 'Object2D',
        init: function () {
            this.matrix   = mat3();
            this.position = vec2.zero;
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

        /**
         * update a object.
         * @param {number} timeStep
         */
        update: function (timeStep) {

            //回転の更新
            this.angularVelocity += this.angularAcc * timeStep;
            var rotateVal = this.angularVelocity * timeStep;

            if (abs(rotateVal) > ANGULAR_VELOCITY_TOLERANCE) {
                this.rotate(rotateVal);
            }

            //速度の更新
            var acc = vec2.multiplyScalar(this.acceleration,  timeStep);
            this.velocity = vec2.add(this.velocity, acc);

            var translateVal = vec2.multiplyScalar(this.velocity, timeStep);

            if (abs(vec2.norm(translateVal)) > LINEAR_VELOCITY_TOLERANCE) {
                this.translate(translateVal);
            }
        },

        /**
         * @return {Array.<vec2>}
         */
        getVertices: function () {
            var vertices = this._shape.vertices;
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
