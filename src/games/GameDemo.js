/**
 * 此类为一个游戏实现类的模板代码。
 * @constructor
 */

function Demo() {

}

// 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
Demo.prototype.onRegLaunch = function (launch) {

};

// 【生命周期函数】预览，此方法应返回一个二维数组，一个row=10，col=11的二维数组。此方法会不停的被调用。
Demo.prototype.getPreviewAtoms = function () {

};

// 【生命周期函数】当游戏启动时调用。
Demo.prototype.onLaunch = function () {

};

// 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
Demo.prototype.onUpdate = function () {

};

// 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
Demo.prototype.onUpdateStatus = function () {

};

// 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
Demo.prototype.onDestroy = function (){

};

// 【事件函数】当某按键抬起时调用
Demo.prototype.onKeyup = function () {

};

// 【事件函数】当某按键按下时调用
Demo.prototype.onKeyDown = function () {

}


exports.Demo = Demo;
