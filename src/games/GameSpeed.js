let { WzwScreen, WzwBomb } = require("../platform/WzwScreen");

const NAME_ME = "me";
const NAME_OTHER = "other";

// 急速模式下，时间长度。
const TURBO_TINESPACE = 16;

// 每关卡的时间长度
const LEVEL_TIMESPACE = [320, 280, 240, 200, 160, 120, 80, 40];
// 每关卡需要经过多少塞车
const LEVEL_COUNT = [21,23,26,29,31,34,37,40,45,50,60,70,80,90,100,120,140,160,200,250,300,400,500,1000];

const GAME_STATUS = {
    STATUS_UNSET: 0,
    STATUS_PAUSE: 1,
    STATUS_GAMEING: 2,
    STATUS_DIEING: 3,
    STATUS_GAMEOVER: 4
};

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

Car.prototype.left = function () {
    if (this.offsetCol-3 > 0) {
        this.offsetCol = this.offsetCol - 3;
    }
};

Car.prototype.right = function () {
    if (this.offsetCol + 3 <= 7) {
        this.offsetCol = this.offsetCol + 3;
    }
};

/**
 * 判断某个塞车和本塞车是否发生碰撞
 * @param car {Car}
 */
Car.prototype.isCarBoom = function (car) {
    if (!car) return false;
    return this.offsetCol === car.offsetCol &&
        (
            (car.offsetRow >= this.offsetRow && car.offsetRow <= this.offsetRow + 3) ||
            (this.offsetRow >= car.offsetRow && this.offsetRow <= car.offsetRow + 3)
        );
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
    let this_ = this;
    WzwScreen.mergeArr(this.atoms, atoms, this.offsetRow, this.offsetCol, function (tarRowIndex, tarColIndex, srcRowIndex, srcColIndex) {
        if (atoms[tarRowIndex][tarColIndex] === 1) return 1;
        return this_.atoms[srcRowIndex][srcColIndex];
    });
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
    this.offsetRow = -wzwScreen.option.atomRowCount;

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
}

Road.prototype.update = function () {
    // 公路向下移动
    if (this.offsetRow < 0) {
        this.offsetRow += 1;
    } else {
        let l = this.left.pop();this.left.splice(0, 0, l);
        let c = this.right.pop();this.right.splice(0, 0, c);
    }
};
Road.prototype.render = function (atoms) {
    WzwScreen.mergeArr(this.left, atoms, this.offsetRow, 0, undefined);
    WzwScreen.mergeArr(this.right, atoms, this.offsetRow, this.wzwScreen.option.atomColCount - 1, undefined);
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
    let p = undefined;
    for (let i = 0; i < this.players.length; i++) {
        if (this.players[i][0] === 1) {
            this.players[i][0] = 0;this.players[i][1] = 0;this.players[i][2] = 0;this.players[i][3] = 0;
            this.turbo = false;
            p = new Car(NAME_ME, this.wzwScreen.option.atomRowCount - 6, this.wzwScreen.option.atomColCount - 7, this.wzwScreen);
            break;
        }
    }

    // 没有生命了。游戏结束
    if (typeof p === "undefined") {
        this.status = GAME_STATUS.STATUS_GAMEOVER;
        let _this = this;
        this.launch.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
            if (index === 0) {
                _this.onDestroy();
            }
        });
    } else {
        // 还有生命，重置状态。开始新游戏。
        this.boom = undefined;
        /** @type {Car[]} */
        this.others = [];
        this.road = new Road(this.wzwScreen);
        this.status = GAME_STATUS.STATUS_GAMEING;
    }

    return p;
};

// 【生命周期函数】当游戏启动时调用。
Speed.prototype.onLaunch = function () {
    this.atoms = this.wzwScreen.makeNewArr();
    this.status = GAME_STATUS.STATUS_GAMEING;
    this.turbo = false;
    this.level = 1;
    this.score = 0;
    this.count = 0; // 其它赛车超过的数量。
    this.best = WzwScreen.storeGet("speed_best") || 0;
    /** @type {WzwBomb} */
    this.boom = undefined;
    this.players = [
        [0,0,0,0],
        [1,1,1,1],
        [1,1,1,1],
        [1,1,1,1],
    ];

    this.wzwScreen.setBest(this.best);
    this.player = this.useNewPlayer();
};

Speed.prototype.onScroeChange = function (sc) {
    this.score = sc;
    if (this.score > this.best) {
        this.best = this.score;
        this.wzwScreen.setBest(this.best);
        WzwScreen.storeSet("speed_best", this.best);
    }
    this.count = this.count + 1;
    this.wzwScreen.setScore(this.score);
    if (this.count > LEVEL_COUNT[this.level - 1]) {
        this.count = 0;
        this.level = this.level + 1;
        this.wzwScreen.setLevel(this.level);
    }
};

Speed.prototype.createOther = function (offsetRow) {
    let car = new Car(NAME_OTHER, offsetRow, [1, 4, 7][WzwScreen.random(0, 3)], this.wzwScreen);
    let this_ = this;
    car.setOnOutScreenListener(function (mcar) {
        if (this_.others) {
            let i = this_.others.findIndex(item => mcar === item);
            if (i !== -1) {
                this_.score += 100;
                this_.onScroeChange(this_.score);
                this_.others.splice(i, 1);
            }
        }
    });
    return car;
}

/**
 * 随机生成其他赛车
 */
Speed.prototype.randomCreateOthers = function () {
    if (typeof this.others === "undefined") this.others = [];
    if (this.others.length <= 0) {
        this.others.push(this.createOther(-5));
    }
    let first = this.others[0];
    if (first && first.offsetRow >= 0 && this.others.length < 4) {
        this.others.splice(0, 0, this.createOther(first.offsetRow - 10))
    }
};

/**
 * 玩家死亡时此函数执行死亡动画+逻辑
 */
Speed.prototype.onPlayerDie = function () {
    let this_ = this;
    this_.status = GAME_STATUS.STATUS_DIEING;
    this_.boom = new WzwBomb({
        offsetRow: this_.player.offsetRow,
        offsetCol: this_.player.offsetCol,
        onEnd: function () {
            this_.status = GAME_STATUS.STATUS_GAMEING;
            this_.player = this_.useNewPlayer();
        }
    })
};

// 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
Speed.prototype.onUpdate = function () {
    if (!this.atoms) {return;}
    if (this.status === GAME_STATUS.STATUS_PAUSE) {return this.atoms;}
    this.atoms = this.wzwScreen.makeNewArr();

    if (this.status === GAME_STATUS.STATUS_GAMEING) {
        // 逻辑更新
        if (Date.now() - (this.gameLastTime || 0) > (this.turbo ? TURBO_TINESPACE : (LEVEL_TIMESPACE[this.level - 1]) || LEVEL_TIMESPACE[LEVEL_TIMESPACE.length - 1])) {
            this.randomCreateOthers();
            this.road.update(this.atoms);
            if (this.player) this.player.update();
            if (this.others && this.others.length > 0) {
                for (let i = 0; i < this.others.length; i++) {this.others[i].update();}
            }

            if (this.others && this.others.length > 0) {
                for (let i = 0; i < this.others.length; i++) {
                    if(this.others[i].isCarBoom(this.player)) {
                        this.onPlayerDie();
                        break;
                    }
                }
            }



            this.gameLastTime = Date.now();
        }
    }

    // 绘制界面
    if (this.others && this.others.length > 0) {
        for (let i = 0; i < this.others.length; i++) {
            this.others[i].render(this.atoms);
        }
    }
    this.road.render(this.atoms);
    if (this.player) {
        this.player.render(this.atoms);
    }
    if (this.boom) {
        this.boom.update();
    }
    if (this.boom) {
        this.boom.render(this.atoms);
    }
    this.wzwScreen.setLevel(this.level);

    return this.atoms;
};

// 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
Speed.prototype.onUpdateStatus = function () {
    if (!this.players) return ;
    return this.players;
};

// 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
Speed.prototype.onDestroy = function (){
    this.wzwScreen.setLevel(0);
    this.wzwScreen.setScore(0);
    this.wzwScreen.setPause(false);
    this.wzwScreen.setBest(0);
    this.boom = undefined;
    this.turbo = false;
    this.launch.exitCurentGame();
};

/**
 * 【事件函数】当某按键抬起时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Speed.prototype.onKeyup = function (key) {


    if (key === "rotate") {
        this.turbo = false
    }
};
/**
 *  【事件函数】当某按键按下时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Speed.prototype.onKeyDown = function (key) {
    if (this.status === GAME_STATUS.STATUS_PAUSE) {
        if (key === "start") {
            this.status = GAME_STATUS.STATUS_GAMEING;
            this.wzwScreen.setPause(false);
        }
        return;
    }

    if (key === "rotate") {
        this.turbo = true
    }

    if (this.status !== GAME_STATUS.STATUS_GAMEING) {return;}
    if (key === "left") {
        this.player.left();
    } else if (key === "right") {
        this.player.right();
    } else if (key === "start") {
        this.status = GAME_STATUS.STATUS_PAUSE;
        this.wzwScreen.setPause(true);
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
