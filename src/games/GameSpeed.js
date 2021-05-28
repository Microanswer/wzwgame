let { WzwScreen } = require("../platform/WzwScreen");

const NAME_ME = "me";
const NAME_OTHER = "other";

// 急速模式下，时间长度。
const TURBO_TINESPACE = 30;

// 每关卡的时间长度
const LEVEL_TIMESPACE = [350, 300, 250, 200, 150, 100, 50];

/**
 * 赛车内
 * @param name
 * @param offsetRow
 * @param offsetCol
 * @param wzwScreen {WzwScreen}
 * @constructor
 */
function Car(name, offsetRow, offsetCol, wzwScreen) {
    this.atoms = [
        [0,1,0],
        [1,1,1],
        [0,1,0],
        [1,1,1]
    ];

    this.offsetCol = offsetCol;
    this.offsetRow = offsetRow;
    this.wzwScreen = wzwScreen;
    this.name = name;
}

Car.prototype.setOnOutScreenListener = function (listener) {
    this.outScreenListener = listener;
};

Car.prototype.update = function () {
    if (this.name === NAME_OTHER) {
        this.offsetRow = this.offsetRow + 1;
    }

    if (this.offsetRow > this.wzwScreen.option.atomRowCount) {
        if (this.outScreenListener) {
            this.outScreenListener(this);
        }
    }
};
Car.prototype.render = function (atoms) {
    WzwScreen.mergeArr(this.atoms, atoms, this.offsetRow, this.offsetCol, undefined);
};


/**
 *
 * @param wzwScreen {WzwScreen}
 * @constructor
 */
function Road(wzwScreen) {
    this.left = [];
    this.right = [];

    let flag = 1; // 0 输出无， 1,2 输出有。
    for (let i = 0; i < wzwScreen; i++) {
        if (i % 2 === 0) {
            this.left.push([flag > 0 ? 1 : 0]);
            this.right.push([flag > 0 ? 1 : 0]);
        }

        if (flag + 1 > 2) {
            flag = 0;
        } else {
            flag = flag + 1;
        }
    }
}

Road.prototype.render = function (atoms) {
    WzwScreen.mergeArr(this.left, atoms, 0, 0, undefined);
    WzwScreen.mergeArr(this.right, atoms, 0, this.wzwScreen.option.atomColCount - 1, undefined);

    let l = this.left.pop();this.left.splice(0, 0, l);
    let c = this.right.pop();this.right.splice(0, 0, c);
};

/**
 * 赛车游戏
 * @constructor
 */

function Speed() {

    this.initPreview();
}

// 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
Speed.prototype.onRegLaunch = function (launch) {

};

// 【生命周期函数】预览，此方法应返回一个二维数组，一个row=10，col=11的二维数组。此方法会不停的被调用。
Speed.prototype.getPreviewAtoms = function () {
    let arr;
    if ((Date.now() - (this.previewLastTime||0) >= this.previewTimeSpace)) {
        arr = this.previewArr[this.previewIndex];
        this.previewIndex ++;
        if (this.previewIndex >= this.previewArr.length) {
            this.previewIndex = 0;
        }
        this.previewLastTime = Date.now();
    }
    return arr;
};

// 【生命周期函数】当游戏启动时调用。
Speed.prototype.onLaunch = function () {

};

// 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
Speed.prototype.onUpdate = function () {

};

// 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
Speed.prototype.onUpdateStatus = function () {

};

// 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
Speed.prototype.onDestroy = function (){

};

// 【事件函数】当某按键抬起时调用
Speed.prototype.onKeyup = function () {

};

// 【事件函数】当某按键按下时调用
Speed.prototype.onKeyDown = function () {

};
/**
 * 初始化预览界面。
 */
Speed.prototype.initPreview = function () {
    this.previewIndex = 0;
    this.previewTimeSpace = 120;
    this.previewArr = [
           [[1,0,1,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [0,0,1,0,0,0,0,0,0,0,0],
            [1,1,0,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,1,0,0,1,0,0],
            [1,0,0,0,1,1,1,1,1,1,1],
            [1,0,0,0,0,1,0,0,1,0,1],
            [0,0,0,0,1,0,1,1,0,1,0],
            [1,0,0,0,0,0,0,0,0,0,1]],

           [[0,0,0,0,0,0,0,0,0,0,0],
            [1,0,1,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [0,0,1,0,0,0,0,0,0,0,0],
            [1,1,0,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [0,0,0,0,1,1,1,0,1,0,0],
            [1,0,0,0,0,1,0,1,1,1,1],
            [1,0,0,0,1,0,1,0,1,0,1],
            [0,0,0,0,0,0,0,1,0,1,0]],

           [[1,0,0,0,0,0,0,1,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [1,0,1,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [0,0,1,0,0,0,0,0,0,0,0],
            [1,1,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,1,1,1,0,0,0,1],
            [0,0,0,0,0,1,0,0,1,0,0],
            [1,0,0,0,1,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,1,0,1]],

           [[1,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,1,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [1,0,1,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [0,0,1,0,0,1,0,0,0,0,0],
            [1,1,0,1,1,1,1,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [0,0,0,0,1,0,1,0,1,0,0],
            [1,0,0,0,0,0,0,1,1,1,1]],

           [[0,0,0,0,0,0,0,1,1,1,0],
            [1,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,1,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [1,0,1,0,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [0,0,1,0,1,1,1,0,0,0,0],
            [1,1,0,1,0,1,0,0,0,0,1],
            [1,0,0,0,1,0,1,0,0,0,1],
            [0,0,0,0,0,0,0,0,1,0,0]],

           [[1,0,0,0,0,0,0,0,1,0,1],
            [0,0,0,0,0,0,0,1,1,1,0],
            [1,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,1,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [1,0,1,0,0,1,0,0,0,0,1],
            [1,1,1,1,1,1,1,0,0,0,1],
            [0,0,1,0,0,1,0,0,0,0,0],
            [1,1,0,1,1,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,1]],

           [[1,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,0,1],
            [0,0,0,0,0,0,0,1,1,1,0],
            [1,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,1,0,1,1],
            [0,0,0,0,0,1,0,0,0,0,0],
            [1,0,1,0,1,1,1,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [0,0,1,0,1,0,1,0,0,0,0],
            [1,1,0,1,0,0,0,0,0,0,1]],

           [[0,1,0,1,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,0,1],
            [0,0,0,0,0,0,0,1,1,1,0],
            [1,0,0,0,0,0,0,0,1,0,1],
            [1,0,0,0,0,1,0,1,0,1,1],
            [0,0,0,0,1,1,1,0,0,0,0],
            [1,0,1,0,0,1,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [0,0,1,0,0,0,0,0,0,0,0]],

           [[1,0,1,0,0,0,0,0,0,0,1],
            [0,1,0,1,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,0,1],
            [0,0,0,0,0,0,0,1,1,1,0],
            [1,0,0,0,0,1,0,0,1,0,1],
            [1,0,0,0,1,1,1,1,0,1,1],
            [0,0,0,0,0,1,0,0,0,0,0],
            [1,0,1,0,1,0,1,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1]],

           [[1,1,1,1,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,1],
            [0,1,0,1,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,1,0,1],
            [0,0,0,0,0,1,0,1,1,1,0],
            [1,0,0,0,1,1,1,0,1,0,1],
            [1,0,0,0,0,1,0,1,0,1,1],
            [0,0,0,0,1,0,1,0,0,0,0],
            [1,0,1,0,0,0,0,0,0,0,1]],
    ]
};

exports.Speed = Speed;
