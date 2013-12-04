(function (ns) {

    ns.contactBias = 0.30;
    ns.contactsLimit = 2;
    ns.iteration = 10;
    ns.slop = -0.55;
    ns.timeStep = 1.0;
    ns.CONTACT_THRESHOLD_NORMAL = 0.99; // 衝突点の閾値（法線方向）
    ns.CONTACT_SAME_POINT = 0.15;
 
}(Phys2D));
