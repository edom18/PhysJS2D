(function (ns) {

    ns.contactBias = 0.40;
    ns.contactsLimit = 2;
    ns.iteration = 10;
    ns.slop = -0.05;
    ns.timeStep = 1.0;
    ns.CONTACT_THRESHOLD_NORMAL = 0.001; // 衝突点の閾値（法線方向）
 
}(Phys2D));
