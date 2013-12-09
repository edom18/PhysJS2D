(function (ns) {

    ns.contactBias = 0.25; //座標のズレ解消のバイアス値
    ns.contactsLimit = 2; //保持する接触点の最大数
    ns.iteration = 10; //イテレーション回数
    ns.slop = -0.001; //接触位置の許容値
    ns.CONTACT_THRESHOLD_NORMAL = -0.01; // 衝突点の閾値（法線方向）
    ns.CONTACT_SAME_POINT = 0.1; //同一点と見なせる誤差
    ns.MOVE_NORMAL = 1.01;
    ns.LINEAR_VELOCITY_TOLERANCE = 0.0001; //停止と見なせる並進速度
    ns.ANGULAR_VELOCITY_TOLERANCE = 0.0001; //停止と見なせる回転速度
 
}(Phys2D));
