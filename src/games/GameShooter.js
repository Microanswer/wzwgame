let {WzwScreen, WzwBomb} = require("../platform/WzwScreen");

const GAME_STATUS = {
    STATUS_UNSET: 0,
    STATUS_PAUSE: 1,
    STATUS_GAMEING: 2,
    STATUS_DIEING: 3,
    STATUS_GAMEOVER: 4
};

const LIEVELS_TIME = [700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100,  100,  100,  100,  100,  100 ];
const LEVEL_COUNT =  [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1100, 1200, 1300, 1400, 1500];


/**
 * 玩家的飞机发射出来的子弹类。
 * @constructor
 * @param wzwScreen {WzwScreen}
 * @param offsetCol {number}
 * @param offsetRow {number}
 * @param wall {number[][]}
 */
function Bullet (offsetCol, offsetRow, wzwScreen, wall) {
    this.disabled = false;
    this.screen = wzwScreen;
    this.offsetCol = offsetCol;
    this.offsetRow = offsetRow;
    this.initOffsetRow = offsetRow;
    this.disabledListener = undefined;
    this.atoms = [[1]];
    this.wall = wall;
    this.distance = 0; // 子弹从发出以来离飞机的距离

    this.speed = 180; // 子弹速度。 单位秒。 每秒200个点的速度。

    // 上面的单位是秒， 在 计算的时候 通常使用的是毫秒，所以此处将速度转换为 每毫秒的速度。 时间×速度 = 距离
    this.speed = (this.speed / 1000);
}

/**
 * 当子弹不可用时的回调。子弹击中了砖块或超出屏幕后，将会不可用。
 */
Bullet.prototype.setDisabledListener = function(disabledListener) {
    this.disabledListener = disabledListener;
};

Bullet.prototype.getMyTargetWallRowIndex = function () {
    for (var i = this.wall.length - 1; i >= 0 ; i--) {
        if (this.wall[i][this.offsetCol] === 1) {
            return i;
        }
    }
    return -999;
};

Bullet.prototype.getScore = function (){
    return this.score || 0;
};

Bullet.prototype.update = function () {
    if (this.disabled) return;

    if (typeof this.lastTime === "undefined") {
        this.lastTime = Date.now();
    }
    let now = Date.now();

    // 上次和这次的时间间隔。 （毫秒的）
    let timePassed = now - this.lastTime;
    // 根据 时间×速度 = 距离 得到新的坐标。
    let newDistance = timePassed * this.speed;
    this.distance = this.distance + newDistance;
    // 使用新的距离计算得到新的坐标。
    this.offsetRow = this.initOffsetRow - Math.round(this.distance);

    let wallRow = this.getMyTargetWallRowIndex();
    if (this.offsetRow <= wallRow && !this.disabled) { // 子弹击中墙块。
        this.disabled = false;
        this.score = 1;
        this.wall[wallRow][this.offsetCol] = 0;
        if (this.disabledListener) {
            this.disabledListener(this);
        }
    }

    if (this.offsetRow < 0 && !this.disabled) { // 此子弹已飞出屏幕。
        this.disabled = true;
        if (this.disabledListener) {
            this.disabledListener(this);
        }
    }

    this.lastTime = Date.now();
};

/**
 * 渲染子弹
 * @param atoms {number [][]}
 */
Bullet.prototype.render = function (atoms) {
    if (this.disabled) return;
    // console.log(this.atoms, atoms);
    WzwScreen.mergeArr(this.atoms, atoms, this.offsetRow, this.offsetCol,undefined);
};

/**
 * 玩家控制的飞机类。
 * @constructor
 * @param screen {WzwScreen}
 * @param wall {number[][]}
 */
function Plane(screen, wall) {
    this.screen = screen;
    this.atoms = [
        [0,1,0],
        [1,1,1]
    ];
    this.wall = wall;

    /** @type {Bullet[]} */
    this.bullets = [];
    this.offsetRow = screen.option.atomRowCount - this.atoms.length;
    this.offsetCol = Math.floor((screen.option.atomColCount - 1 - this.atoms[0].length) / 2);
    this.onWallHinted = undefined;
}

Plane.prototype.setOnWallHintedListener = function(onWallHinted) {
    this.onWallHinted = onWallHinted;
};

/**
 * 飞机向左边移动
 */
Plane.prototype.left = function () {
    if (this.offsetCol - 1 <= -2) {
        // 不能再向左了，会超出屏幕。 允许到达-1， 这样枪管才能打到最左边的砖块。右边也是同样的道理。
        return;
    }

    this.offsetCol = this.offsetCol - 1;
};

/**
 * 飞机向右边移动
 */
Plane.prototype.right = function () {
    if (this.offsetCol + 1 >= this.screen.option.atomColCount - 1) {
        return
    }
    this.offsetCol = this.offsetCol + 1;
};

/**
 * 发射子弹
 */
Plane.prototype.shoot = function () {
    var _this = this;

    if (_this.bullets.length > 2) {
        return ;
    }

    var b = new Bullet(this.offsetCol + 1, this.offsetRow - 1, this.screen, this.wall);
    b.setDisabledListener(function (bullet) {

        if (bullet.getScore() > 0) {
            if (_this.onWallHinted) {
                _this.onWallHinted(bullet.getScore());
            }
        }

        let index =  _this.bullets.indexOf(bullet);
        if (index !== -1) {
            _this.bullets.splice(index, 1);
        }
    });
    this.bullets.push(b);
};

/**
 * 更新函数。
 * @param atoms
 */
Plane.prototype.update = function () {
    for (let i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i]) {
            this.bullets[i].update();
        }
    }
};

/**
 * 渲染含数
 * @param atoms {number[][]}
 */
Plane.prototype.render = function (atoms) {
    WzwScreen.mergeArr(this.atoms, atoms, this.offsetRow, this.offsetCol, undefined);
    for (let i = 0; i < this.bullets.length; i++) {
        if(this.bullets[i]) {
            this.bullets[i].render(atoms);
        }
    }
};


/**
 * 此类为一个游戏实现类的模板代码。
 * @constructor
 */

function Shooter() {
    this.status = GAME_STATUS.STATUS_UNSET;

    this.initPreview();
}

/**
 * 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
 * @param launch {WzwLauncher}
 */
Shooter.prototype.onRegLaunch = function (launch) {
    this.launch = launch;
    this.screen = launch.screen;
};

/**
 * 【生命周期函数】预览，此方法应返回一个二维数组，一个row=10，col=11的二维数组。此方法会不停的被调用。
 */
Shooter.prototype.getPreviewAtoms = function () {
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
 * 开始一个新玩家的游戏。
 */
Shooter.prototype.startNewGame = function () {
    let player = undefined;
    let _this = this;
    this.wall = [];
    for (let i = 0; i < _this.life.length; i++) {
        if (_this.life[i][0] === 1) {
            player = new Plane(_this.screen, _this.wall);

            player.setOnWallHintedListener(function (score) {
                _this.wallShootedCount = _this.wallShootedCount + 1;
                _this.score = _this.score + score;
                _this.screen.setScore(_this.score);
                if (_this.score > _this.bestScore) {
                    _this.bestScore = _this.score;
                    _this.screen.setBest(_this.bestScore);
                    WzwScreen.storeSet("shooter_best", _this.bestScore);
                }

                if (_this.wallShootedCount >= (LEVEL_COUNT[_this.level] || LEVEL_COUNT[LEVEL_COUNT.length - 1])) {
                    _this.wallShootedCount = 0;
                    _this.level = _this.level + 1;
                    _this.screen.setLevel(_this.level + 1);
                }
            });
            _this.life[i][0] = 0;
            _this.life[i][1] = 0;
            _this.life[i][2] = 0;
            _this.life[i][3] = 0;
            break;
        }
    }

    if (player) {
        this.player = player;
        this.status = GAME_STATUS.STATUS_GAMEING;
    } else {
        // 没有生命了，游戏结束。
        this.status = GAME_STATUS.STATUS_GAMEOVER;

        let _this = this;
        this.launch.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
            if (index === 0) {
                _this.onDestroy();
            }
        });
    }

};

/**
 * 【生命周期函数】当游戏启动时调用。
 */
Shooter.prototype.onLaunch = function () {
    this.life = [
        [0,0,0,0],
        [1,1,1,1],
        [1,1,1,1],
        [1,1,1,1],
    ];

    /** @type Plane */
    this.player = undefined;
    /** @type {WzwBomb} */
    this.boom = undefined;
    this.score = 0;
    this.bestScore = WzwScreen.storeGet("shooter_best") || 0;
    this.level = 0;
    this.wallShootedCount = 0; // 射击了的砖块数量，
    this.screen.setLevel(this.level + 1);
    this.screen.setBest(this.bestScore);

    this.startNewGame();
};

/**
 * 生成墙壁。
 */
Shooter.prototype.growWall = function () {
    if (typeof this.lastTime == 'undefined') {
        this.lastTime = 0;
    }

    // 判断最下面的行是否被清空了，清空了后就移除这一行了。
    if (this.wall.length > 0) {
        var lastRow = this.wall[this.wall.length - 1];
        var lastRowEmpty = true;
        for (var i = 0; i < lastRow.length; i++) {
            if (lastRow[i] === 1) {
                lastRowEmpty = false;
                break;
            }
        }
        if (lastRowEmpty) {
            this.wall.pop();
        }
    }

    if(Date.now() - this.lastTime >= (LIEVELS_TIME[this.level] || 30)) {

        var arr =[];
        for (var i = 0; i < this.screen.option.atomColCount; i++) {
            arr.push(Math.random() > 0.8? 0 : 1);
        }

        this.wall.splice(0,0, arr);
        this.lastTime = Date.now();
    }

};

/**
 * 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
 */
Shooter.prototype.onUpdate = function () {
    var atoms = this.screen.makeNewArr();

    // update ===================
    if (this.status === GAME_STATUS.STATUS_GAMEING) {
        if (this.player) {
            this.player.update();

            // 陆续生成墙壁。
            this.growWall();

            // 判断墙壁是否到底玩家头上。
            if (this.wall.length > this.player.offsetRow) {
                this.status = GAME_STATUS.STATUS_DIEING;
                var _this = this;
                this.boom = new WzwBomb({
                    offsetCol: this.player.offsetCol,
                    offsetRow: this.player.offsetRow,
                    onEnd: function () {
                        _this.boom = undefined;
                        _this.startNewGame();
                    }
                });
            }
        }
    }
    if(this.boom) {
        this.boom.update();
    }

    // render ====================
    if (this.player) {
        this.player.render(atoms);
    }
    if (this.wall) {
        WzwScreen.mergeArr(this.wall, atoms, 0, 0, undefined);
    }
    if (this.boom) {
        this.boom.render(atoms);
    }


    return atoms;
};

/**
 * 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
 */
Shooter.prototype.onUpdateStatus = function () {
    if (this.life) return this.life;
};

/**
 * 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
 */
Shooter.prototype.onDestroy = function (){
    this.launch.exitCurentGame();
    this.screen.setPause(false);
    this.screen.setScore(0);
    this.screen.setBest(0);
    this.screen.setLevel(0);
    WzwScreen.storeSet("shooter_best", this.bestScore);
};


/**
 * 【事件函数】当某按键抬起时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Shooter.prototype.onKeyup = function (key) {
    if (key === "start") {

        if (this.status === GAME_STATUS.STATUS_PAUSE) {
            this.status = GAME_STATUS.STATUS_GAMEING;
            this.screen.setPause(false);
        } else if (this.status === GAME_STATUS.STATUS_GAMEING){
            this.status = GAME_STATUS.STATUS_PAUSE;
            this.screen.setPause(true);
        }
    }
};


/**
 * 【事件函数】当某按键按下时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Shooter.prototype.onKeyDown = function (key) {
    if (!this.player) {return}
    if (this.status !== GAME_STATUS.STATUS_GAMEING) {return;}
    if (key === "left") {
        this.player.left();
    } else if (key === "right") {
        this.player.right();
    } else if (key === "rotate") {
        this.player.shoot();
    }
};



Shooter.prototype.initPreview = function () {
    this.previewIndex = 0;
    this.previewTimeSpace = 120;
    this.previewArr = [
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,1,1,1,1,1,0,1,0,1],
            [1,1,1,0,1,1,0,1,1,1,1],
            [0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0,0]
        ],

        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,1,1,1,1,1,0,1,0,1],
            [1,1,1,0,1,1,0,1,1,1,1],
            [0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,1,1,1,1,1,0,1,0,1],
            [1,1,1,1,1,1,0,1,1,1,1],
            [0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0]
        ],

        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,1,1,1,0,1,0,1],
            [1,1,0,1,1,1,0,1,1,1,1],
            [0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,1,0,1,0,1],
            [1,1,0,1,0,1,0,1,1,1,1],
            [0,0,0,0,1,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,1,1,1,0,1,0,1],
            [1,1,0,1,0,1,0,1,1,1,1],
            [0,0,0,0,0,1,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,1,1,1,0,0,0]
        ],


        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,1,0,1,0,1],
            [1,1,0,1,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,1,0,1,0,1],
            [1,1,0,1,0,0,1,1,1,1,1],
            [0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0]
        ],


        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,1,1,1,0]
        ],
        [
            [1,1,1,1,0,0,1,1,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,1,1,1,0]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,1,1,1],
            [0,0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,1,1,1]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,1,1,1]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,1,1,1]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,1,1,1,0]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,1,1,1,0,0,0]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,1,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0]
        ],
        [
            [1,1,1,1,0,0,1,0,0,1,1],
            [0,0,0,1,0,0,0,0,1,0,1],
            [1,1,0,1,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0,0]
        ],
    ]
};

exports.Shooter = Shooter;
