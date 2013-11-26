(function (ns) {

    /**
     * 拘束解消計算用クラス
     * @class
     * @param {Phys2D.Object2D} body 値をコピーする剛体
     */
    var SolverBody = Class.extend({
        init: function (body) {
            this._body = body;

            this.mass = body.mass;
            this.massInv = this.mass ? 1 / this.mass : 0;

            this.inertia = body.inertia;
            this.inertiaInv = this.inertia ? 1 / this.inertia : 0;

            this.centerVert = body.getCenter();
        },

        /** @type {number} 質量の逆数 */
        massInv: 0.0,

        /** @type {number} 慣性モーメントの逆数 */
        inertiaInv: 0.0,

        /** @type {vec2} 差分並進速度 */
        deltaLinearVelocity : null,

        /** @type {vec2} 差分角速度 */
        deltaAngularVelocity: null
    });

    /*! ----------------------------------------------------------
        EXPORTS
    -------------------------------------------------------------- */
    ns.SolverBody = SolverBody;
 
}(Phys2D));
