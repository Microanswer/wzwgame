const { Car, NAME_FREE, Road } = require("./GameSpeed");
const { WzwScreen, WzwBomb } = require("../platform/WzwScreen");

const LEVEL_TIMESPACE = [150, 140, 130, 120, 110, 100, 90, 80, 70, 60 ,50, 40,];
const LEVEL_COUNT = [50, 50, 60, 60, 70, 70, 80, 80, 90, 90];
const TURBO_TINESPACE = 16;
const GAME_STATUS = {
    STATUS_UNSET: 0,
    STATUS_PAUSE: 1,
    STATUS_GAMEING: 2,
    STATUS_DIEING: 3,
    STATUS_GAMEOVER: 4
};

const WALL_SPACE = 5; // 墙壁中间的间隙。
const WALL_LENGTH = 10; // 墙壁长度。

/**@type{"left"|"right"}*/
let WALL_WAY = "left";
/**
 * 墙壁
 * @param screen {WzwScreen}
 * @param wall {Wall}
 * @constructor
 */
function Wall(screen, wall) {
    this.screen = screen;

    if (typeof wall === "undefined") {
        this.offsetCol = WzwScreen.random(0, this.screen.option.atomColCount - WALL_SPACE);
        this.offsetRow = -WALL_LENGTH;
    } else {
        this.offsetRow = wall.offsetRow - WALL_LENGTH;
        if (wall.offsetCol == (screen.option.atomColCount - WALL_SPACE)) {
            WALL_WAY = "left";
        } else if(wall.offsetCol == 0) {
            WALL_WAY = "right";
        }

        // 这一段作用： 当路段在比较中间的时候，随机让下一个空隙路段在左边或者右边生成。而不是一直向着某个方向生成。
        if (wall.offsetCol >= 2 && wall.offsetCol<= this.screen.option.atomColCount - WALL_SPACE - 2){
            if (Math.random() > 0.5) {
                if (WALL_WAY === "left") {
                    WALL_WAY = "right";
                } else {
                    WALL_WAY = "left";
                }
            }
        }


        let flag = Math.random() > 0.3;
        if (flag) {
            if (WALL_WAY === "left") {
                this.offsetCol = wall.offsetCol - 1;
            } else {
                this.offsetCol = wall.offsetCol + 1;
            }
        } else {
            this.offsetCol = wall.offsetCol;
        }

    }

    // 墙壁。
    let arr = [];
    for (let i = 0; i < WALL_LENGTH; i++) {
        let row = [];
        for (let j = 0; j < this.screen.option.atomColCount; j++) {

            if (j < this.offsetCol) {
                row.push(1);
            } else if (this.offsetCol <= j && j < this.offsetCol + WALL_SPACE) {
                row.push(0);
            } else if (this.offsetCol + WALL_SPACE <= j) {
                row.push(1);
            }
        }

        arr.push(row);
    }

    this.atom = arr;
    this.disabled = false;
    this.outOfScreenListener = undefined;

}
Wall.prototype.setOnOutOfScreenListener = function(outOfScreenListener) {
    this.outOfScreenListener = outOfScreenListener;
};

Wall.prototype.update = function () {
    if (this.disabled) return;

    this.offsetRow = this.offsetRow + 1;
    if (this.offsetRow >= this.screen.option.atomRowCount) {
        this.disabled = true;
        this.outOfScreenListener && this.outOfScreenListener(this);
    }
};

/**
 * 赛车是否碰撞了墙壁。
 * @param car {Car}
 */
Wall.prototype.isCarBoom = function(car) {
    if (!car) return false;

    let colBoom = false;

    if (car.offsetCol < this.offsetCol){colBoom = true;}
    if (car.offsetCol + 3 > this.offsetCol + WALL_SPACE) {colBoom = true;}

    // 车子侧墙壁会被碰撞。此时检测 水平方向是否会碰撞。
    if (colBoom) {

        if (this.offsetRow >= car.offsetRow && this.offsetRow <= car.offsetRow + 4) {
            return true;
        }

        if (car.offsetRow >= this.offsetRow && car.offsetRow < this.offsetRow + WALL_LENGTH) {
            return true;
        }
    }

    return false;
};

/**
 *
 * @param atoms {number[][]}
 */
Wall.prototype.render = function (atoms) {
    if (this.disabled) return;
    let _this = this;
    WzwScreen.mergeArr(this.atom, atoms, this.offsetRow, 0, function (tarRowIndex, tarColIndex, srcRowIndex, srcColIndex) {
        if (atoms[tarRowIndex][tarColIndex] === 1) {return 1;}
        return _this.atom[srcRowIndex][srcColIndex];
    });
};

/**
 * 《障碍赛车》
 * @constructor
 */
function Speed2() {
    this.score = 0;
    this.level = 1;
    this.bestScore = 0;
    this.status = GAME_STATUS.STATUS_UNSET;

    this.initPreview();
}

/**
 * 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
 * @param launch {WzwLauncher}
 */
Speed2.prototype.onRegLaunch = function (launch) {
    this.launch = launch;
    this.screen = launch.screen;
};

/**
 * 【生命周期函数】预览，此方法应返回一个二维数组，一个row=10，col=11的二维数组。此方法会不停的被调用。
 */
Speed2.prototype.getPreviewAtoms = function () {
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
 * 使用一次玩家机会并开始新游戏。
 *
 * @return {Car}
 */
Speed2.prototype.startNewGame = function () {
    let p = undefined;
    for (let i = 0; i < this.life.length; i++) {
        if (this.life[i][0] === 1) {
            this.life[i][0] = 0;this.life[i][1] = 0;this.life[i][2] = 0;this.life[i][3] = 0;
            p = new Car(NAME_FREE, this.screen.option.atomRowCount - 6, this.screen.option.atomColCount - 7, this.screen);
            break;
        }
    }

    if (p) {
        // 还有生命。
        this.status = GAME_STATUS.STATUS_GAMEING;

        /**@type {Wall[]}*/
        this.walls = [];
        this.turbo = false;
    } else  {
        // 游戏结束。
        let _this = this;
        _this.status = GAME_STATUS.STATUS_GAMEOVER;
        _this.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
            if (index === 0) {
                _this.onDestroy();
            }
        });
    }

    return p;
};

/**
 * 【生命周期函数】当游戏启动时调用。
 */
Speed2.prototype.onLaunch = function () {
    this.score = 0;
    this.bestScore = WzwScreen.storeGet("speed2_best") || 0;
    this.screen.setBest(this.bestScore);
    /**@type {WzwBomb}*/
    this.boom = undefined;
    this.turbo = false;
    this.level = 1;
    this.status = GAME_STATUS.STATUS_UNSET;
    this.life = [
        [0,0,0,0],
        [1,1,1,1],
        [1,1,1,1],
        [1,1,1,1],
    ];

    this.player = this.startNewGame();
};

/**
 * 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
 */
Speed2.prototype.onUpdate = function () {
    if (!this.screen) return;
    let atoms = this.screen.makeNewArr();
    let _this = this;

    if (this.player) {
        if (this.status === GAME_STATUS.STATUS_GAMEING) {

            this.player.update();

            if (this.walls.length < 5) {
                let w = new Wall(this.screen, this.walls[this.walls.length - 1]);
                w.setOnOutOfScreenListener(function (wall) {
                    let i = _this.walls.indexOf(wall);
                    if (i > -1) {
                        _this.walls.splice(i, 1);
                    }
                    _this.score = _this.score + 100;
                    _this.screen.setScore(_this.score);

                    if (_this.score > _this.bestScore) {
                        _this.bestScore = _this.score;
                        _this.screen.setBest(_this.bestScore);
                        WzwScreen.storeSet("speed2_best", _this.bestScore);
                    }

                    if (typeof _this.wallCount === "undefined") {
                        _this.wallCount = 1;
                    } else {
                        _this.wallCount = _this.wallCount + 1;
                    }

                    if (_this.wallCount >= (LEVEL_COUNT[_this.level-1]||LEVEL_COUNT[LEVEL_COUNT.length-1])){
                        _this.wallCount = 0;
                        _this.level = _this.level + 1;
                        _this.screen.setLevel(_this.level);
                    }

                });
                this.walls.push(w);
            }

            if (Date.now() - (this.gameLastTime || 0) > (this.turbo ? TURBO_TINESPACE : (LEVEL_TIMESPACE[this.level - 1]) || LEVEL_TIMESPACE[LEVEL_TIMESPACE.length - 1])) {


                for (let i = 0; i < this.walls.length; i++) {
                    if (this.walls[i]) {
                        this.walls[i].update();
                    }
                }


                this.gameLastTime = Date.now();
            }

            let crsh = false;
            for (let i = 0; i < this.walls.length; i++) {
                if (this.walls[i]) {
                    crsh = this.walls[i].isCarBoom(this.player);
                    if (crsh) {
                        this.status = GAME_STATUS.STATUS_DIEING;
                        // 玩家碰壁。
                        this.boom = new WzwBomb({
                            offsetCol: this.player.offsetCol,
                            offsetRow: this.player.offsetRow,
                            onEnd: function () {
                                _this.boom = undefined;
                                _this.startNewGame();
                            }
                        });

                        break;
                    }
                }
            }

        }

        for (let i = 0; i < this.walls.length; i++) {
            if (this.walls[i]) {
                this.walls[i].render(atoms);
            }
        }

        if (this.boom) {
            this.boom.update();
        }


        this.player.render(atoms);
        if (this.boom) {
            this.boom.render(atoms);
        }

    }


    return atoms;
};

/**
 * 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
 */
Speed2.prototype.onUpdateStatus = function () {
    return this.life;
};

/**
 * 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
 */
Speed2.prototype.onDestroy = function (){
    this.score = 0;
    this.bestScore = 0;
    /**@type {WzwBomb}*/
    this.boom = undefined;
    this.turbo = false;
    this.level = 1;
    this.player = undefined;
    this.screen.setPause(false);
    this.screen.setBest(0);
    this.screen.setScore(0);
    this.screen.setLevel(0);
    this.launch.exitCurentGame();
};


/**
 * 【事件函数】当某按键抬起时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Speed2.prototype.onKeyup = function (key) {
    if (this.status === GAME_STATUS.STATUS_GAMEING && this.player) {
        if (key === "rotate") {
            this.turbo = false
        }
    }
};


/**
 * 【事件函数】当某按键按下时调用
 *  @param key {"up" |"right" |"down" |"left" |"rotate" |"start" |"voice" |"onoff" |"reset"}
 */
Speed2.prototype.onKeyDown = function (key) {

    if (this.player) {
        if (this.status === GAME_STATUS.STATUS_PAUSE && key === "start") {
            this.status = GAME_STATUS.STATUS_GAMEING;
            this.screen.setPause(false)
            return;
        }
    }

    if (this.status === GAME_STATUS.STATUS_GAMEING && this.player) {
        if(key === "left") {
            this.player.left();
        } else if(key === "right") {
            this.player.right();
        } else if (key === "start") {
            this.status = GAME_STATUS.STATUS_PAUSE;
            this.screen.setPause(true);
        } else if (key === "rotate") {
            this.turbo = true
        }
    }
};


Speed2.prototype.initPreview = function () {
    this.previewIndex = 0;
    this.previewTimeSpace = 40;
    this.previewArr = [
        // 填充预览帧。
        [
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,0,0,1,1,1,0,1,1,1],
            [1,1,0,0,0,1,0,0,1,1,1],
            [1,1,0,0,1,0,1,0,1,1,1],
            [1,1,0,0,0,0,0,0,1,1,1]
        ],
        [
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,1,1,0,0,1,1],
            [1,1,0,0,0,1,0,0,1,1,1],
            [1,1,0,0,1,0,1,0,1,1,1],
            [1,1,0,0,0,0,0,0,1,1,1],
        ],
        [
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,1,1,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,0,0,1,0,1,0,1,1,1],
            [1,1,0,0,0,0,0,0,1,1,1],
        ],
        [
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,1,1,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,0,1,0,0,1,1],
            [1,1,0,0,0,0,0,0,1,1,1],
        ],
        [
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,1,1,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,0,1,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
        ],
        [
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,1,1,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,0,1,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
        ],
        [
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,0,1,1,1,0,0,1,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,0,1,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,1,1,1,1,0,0,0,1],
            [1,1,1,0,0,1,0,0,0,1,1],
            [1,1,1,0,1,0,1,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,1,1,1,1,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,0,1,0,1,0,0,1,1],
            [1,1,1,0,0,0,0,0,0,1,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,1,1,1,1,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [1,1,1,0,0,0,0,0,0,1,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,1,1,1,1,0,0,0,1],
            [1,1,1,1,0,1,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,0,0,1,0,0,0,1],
            [1,1,1,1,0,1,1,1,0,0,1],
            [1,1,1,1,0,0,1,0,0,0,1],
            [1,1,1,1,0,1,0,1,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [1,1,1,1,0,1,1,1,0,0,1],
            [1,1,1,1,0,0,1,0,0,0,1],
            [1,1,1,1,0,1,0,1,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [1,1,1,1,1,1,1,1,0,0,1],
            [1,1,1,1,0,0,1,0,0,0,1],
            [1,1,1,1,0,1,0,1,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [1,1,1,1,1,1,1,1,0,0,1],
            [1,1,1,1,1,0,1,0,0,0,1],
            [1,1,1,1,0,1,0,1,0,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,1,1,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,0,1,0,1],
            [1,1,1,1,0,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,1,1,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,0,1,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,1,1,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,0,1,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,0,0,1],
            [1,1,1,1,1,0,1,1,1,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,0,1,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
        ],
        [
            [1,1,1,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,0,0,1],
            [1,1,1,1,1,1,1,1,1,0,1],
            [1,1,1,1,1,0,0,1,0,0,1],
            [1,1,1,1,1,0,1,0,1,0,1],
            [1,1,1,1,1,0,0,0,0,0,1],
        ],
    ]
};

exports.Speed2 = Speed2;
