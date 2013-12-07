(function (ns) {

    'use strict';

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


    /*! -----------------------------------------------------
        EXPORTS
    --------------------------------------------------------- */
    ns.Scene = Scene;

}(Phys2D));
