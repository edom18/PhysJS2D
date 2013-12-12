(function (ns) {

    /**
     * Shapeのベースクラス
     * @class
     */
    var Shape = Class.extend({
        $class: 'Shape',
        type: ns.shapeType.polygonShapeBit,
        init: function () {
            this.colliders = [];
        },

        /** @type {Array<Phys2D.Collider>} */
        colliders: null,

        /**
         * 形状にあったコライダを生成する
         */
        _createCollider: ns.abstractFunction
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.Shape = Shape;
 
}(Phys2D));
