let { WzwScreen } = require("../platform/WzwScreen");

const NAME_ME = "me";
const NAME_OTHER = "other";

// 急速模式下，时间长度。
const TURBO_TINESPACE = 30;

// 每关卡的时间长度
const LEVEL_TIMESPACE = [320, 280, 240, 200, 160, 120, 80, 40];

const GAME_STATUS = {
    STATUS_UNSET: 0,
    STATUS_PAUSE: 1,
    STATUS_GAMEING: 2,
    STATUS_DIEING: 3,
    STATUS_GAMEOVER: 4
}

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
        [1,0,1]
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
    this.wzwScreen = wzwScreen;

    let flag = 1; // 0 输出无， 1,2 输出有。
    for (let i = 0; i < wzwScreen.option.atomRowCount; i++) {

        this.left.push([flag > 0 ? 1 : 0]);
        this.right.push([flag > 0 ? 1 : 0]);

        if (flag + 1 > 2) {
            flag = 0;
        } else {
            flag = flag + 1;
        }
    }
    console.log(this.left);
}

Road.prototype.render = function (atoms) {
    WzwScreen.mergeArr(this.left, atoms, 0, 0, undefined);
    WzwScreen.mergeArr(this.right, atoms, 0, this.wzwScreen.option.atomColCount - 1, undefined);

    // 公路向下移动
    let l = this.left.pop();this.left.splice(0, 0, l);
    let c = this.right.pop();this.right.splice(0, 0, c);
};

/**
 * 赛车游戏
 * @constructor
 */

function Speed() {
    this.status = GAME_STATUS.STATUS_UNSET;

    this.initPreview();
}

/** 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
 *
 * @param launch {WzwLauncher}
 */
Speed.prototype.onRegLaunch = function (launch) {
    this.launch = launch;
    this.wzwScreen = launch.screen;
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

/**
 * 消耗并产生一个新的玩家。
 */
Speed.prototype.useNewPlayer = function () {
    return new Car(NAME_ME, this.wzwScreen.option.atomRowCount - 6, this.wzwScreen.option.atomColCount - 7, this.wzwScreen);
};

// 【生命周期函数】当游戏启动时调用。
Speed.prototype.onLaunch = function () {
    this.road = new Road(this.wzwScreen);
    this.atoms = this.wzwScreen.makeNewArr();
    this.status = GAME_STATUS.STATUS_GAMEING;
    this.turbo = false;
    this.level = 1;

    this.player = this.useNewPlayer();
};

// 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
Speed.prototype.onUpdate = function () {
    if (!this.atoms) {return;}
    if (this.status === GAME_STATUS.STATUS_PAUSE) {return this.atoms;}

    if (Date.now() - (this.gameLastTime || 0) > (this.turbo ? TURBO_TINESPACE : LEVEL_TIMESPACE[this.level - 1])) {

        this.atoms = this.wzwScreen.makeNewArr();
        this.road.render(this.atoms);
        this.player.render(this.atoms);
        this.gameLastTime = Date.now();
    }

    return this.atoms;
};

// 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
Speed.prototype.onUpdateStatus = function () {

};

// 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
Speed.prototype.onDestroy = function (){

};

/**
 * 【事件函数】当某按键抬起时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Speed.prototype.onKeyup = function (key) {
    if (this.status === GAME_STATUS.STATUS_PAUSE) {
        if (key === "start") {
            this.status = GAME_STATUS.STATUS_GAMEING;
        }
        return;
    }
    if (key === "rotate") {
        this.turbo = false
    }
};
/**
 *  【事件函数】当某按键按下时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Speed.prototype.onKeyDown = function (key) {
    if (this.status === GAME_STATUS.STATUS_PAUSE) {return;}

    if (key === "rotate") {
        this.turbo = true
    }
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
