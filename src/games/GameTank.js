let { WzwScreen, WzwBomb } = require("../platform/WzwScreen");

// 一个坦克同时最多发出这么多个子弹
const BALLMAXCOUNT = 2;

// 各个等级下的更新速度，坦克(敌方)的运动速度
const LEVELS = [550, 540, 530, 520, 500, 490, 480, 470, 450, 430, 410, 400, 380, 350, 340, 330, 300, 280, 260, 240, 200];

// 指定关卡需要射击多少个坦克才可以提升关卡。
const SHOOT_LEVELS = {
    '0':  15,
    '1':  20,
    '2':  25,
    '3':  32,
    '4':  40,
    '5':  50,
    '6':  60,
    '7':  75,
    '8':  90,
    '9':  100,
    '10': 110,
    '11': 120,
    '12': 130,
    '13': 140,
    '14': 150,
    '15': 160,
    '16': 170,
    '17': 180,
    '18': 190,
    '19': 200,
    '20': 300,
};

// 角色，就两种， 敌方和我放
const ROLE = {
    HERO: 1, // 我方
    FOE: 2   // 敌方
};

// 坦克\子弹的方向，有：上、下、左、右
const DIRECTION = {
    UP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4,

    UP_ARR:    function () {
        return [[0,1,0],
            [1,1,1],
            [1,0,1]]},

    RIGHT_ARR:  function () {
        return [[1,1,0],
            [0,1,1],
            [1,1,0]]},

    BOTTOM_ARR: function () {
        return [[1,0,1],
            [1,1,1],
            [0,1,0]]},

    LEFT_ARR:   function () {
        return [[0,1,1],
            [1,1,0],
            [0,1,1]]},
};

// 游戏状态
const GAME_STATUS = {
    NORMAL: 1,  // 正常游戏。
    KILLED: 2,  // 玩家被打。
    PAUSED: 3,  // 游戏暂停。
    GAMEOVER: 6, // 游戏结束。
};

/**
 * 子弹类。
 * @param tanker 坦克
 * @param onUnAvailable 当子弹失效时的回调。
 * @constructor
 */
function Ball(tanker, onUnAvailable) {

    // 子弹类里有一个tanker属性，以知晓这个子弹是来自哪一个坦克的。
    this.tanker = tanker;

    // 使用坦克此时的方向来初始化子弹的方向，子弹是不可以改变方向的。
    this.direction = this.tanker.direction;

    // 子弹的移动间隔时间。
    this.time = 42;

    this.available = true;

    this.onUnAvailable = onUnAvailable;

    // 初始化子弹的位置，要根据Tanker当前不同的方向来确定子弹初始的位置，所以提取为一个单独方法/
    this.initBallOffset();
}

Ball.prototype.initBallOffset = function () {

    // 发射子弹的是boss。
    if (this.tanker.boss) {
        this.offsetRow = this.tanker.offsetRow + 7;
        this.offsetCol = this.tanker.offsetCol + 3;
        return;
    }

    if (this.tanker.direction === DIRECTION.UP) {
        this.offsetRow = this.tanker.offsetRow;
        this.offsetCol = this.tanker.offsetCol + 1;
    } else if (this.tanker.direction === DIRECTION.RIGHT) {
        this.offsetRow = this.tanker.offsetRow + 1;
        this.offsetCol = this.tanker.offsetCol + 2;
    } else if (this.tanker.direction === DIRECTION.BOTTOM) {
        this.offsetRow = this.tanker.offsetRow + 2;
        this.offsetCol = this.tanker.offsetCol + 1;
    } else if (this.tanker.direction === DIRECTION.LEFT) {
        this.offsetRow = this.tanker.offsetRow + 1;
        this.offsetCol = this.tanker.offsetCol;
    } else {
        throw new Error("未知的坦克方向。");
    }
};

/**
 * 更新方法，此方法应该在Tanker类的update中调用，因为是坦克持有子弹。
 */
Ball.prototype.update = function () {
    if (!this.available) return;

    if ((Date.now() - (this.lastTime||0)) >= this.time) {
        if (this.direction === DIRECTION.UP) {
            this.offsetRow = this.offsetRow - 1;
        } else if (this.direction === DIRECTION.RIGHT) {
            this.offsetCol = this.offsetCol + 1;
        } else if (this.direction === DIRECTION.BOTTOM) {
            this.offsetRow = this.offsetRow + 1;
        } else if (this.direction === DIRECTION.LEFT) {
            this.offsetCol = this.offsetCol - 1;
        }
        this.lastTime = Date.now();
    }
    // 检查位置是否可用。即判断是否跑出屏幕外面了。
    this.offsetAvailable();

    // 检查打没打到人。
    this.checkKilled();
};

Ball.prototype.offsetAvailable = function () {
    if (
        this.offsetRow < 0 || this.offsetRow >= this.tanker.launch.screen.option.atomRowCount ||
        this.offsetCol < 0 || this.offsetCol >= this.tanker.launch.screen.option.atomColCount
    ) {
        // 屏幕外面。
        this.available = false;
        if (this.onUnAvailable) {
            this.onUnAvailable(this);
        }
    }
}

/**
 * 检查此子弹是否打中某坦克。或打中坦克的子弹
 */
Ball.prototype.checkKilled = function () {
    let _this = this;

    try {
        if (_this.tanker.role === ROLE.HERO) {
            // 玩家的子弹是否打中敌机。
            WzwScreen.each(_this.tanker.tank.tankers, function (tanker, index) {
                if (tanker.isAtomIn(_this.offsetRow, _this.offsetCol)) {
                    // 打中了。使用 throw 可以直接中断 each 循环。
                    throw {message: "killed", index: index, tanker: tanker};
                }
            })

            // 玩家的子弹是否打中boss
            if (_this.tanker.tank.boss && _this.tanker.tank.boss.isAtomIn(_this.offsetRow, _this.offsetCol)) {
                if (_this.tanker.tank.boss.isAtomInGun(_this.offsetRow, _this.offsetCol)) {
                    throw {message: "killed", index: 0, tanker: _this.tanker.tank.boss};
                }
                throw {message: "hited", index: 0};
            }

        } else if (_this.tanker.role === ROLE.FOE) {
            // 敌人的子弹是否打中玩家/
            if (_this.tanker.tank.hreo && _this.tanker.tank.hreo.isAtomIn(_this.offsetRow, _this.offsetCol)) {
                throw {message: "killed", index: 0, tanker: _this.tanker.tank.hreo};
            }

            // 敌人的子弹是否打中玩家的子弹 - 不需要判断玩家的子弹是否打中敌人的子弹，因为2个子弹相遇会同时消失。所以只有这里有对子弹的判断。
            if (_this.tanker.tank.hreo && _this.tanker.tank.hreo.isAtomInAtom(_this.offsetRow, _this.offsetCol)) {
                throw {message: "hited", index: 0};
            }
        }
    }catch (e) {
        if (e.message === "killed") {

            if (e.tanker.role === ROLE.FOE) {
                if (e.tanker.boss) {
                    // boss被杀。
                    _this.tanker.tank.onBossKill();
                } else {
                    // 敌人被杀。 删除这个敌人。
                    _this.tanker.tank.tankers.splice(e.index, 1);
                    _this.tanker.tank.onEofKill();
                }
            } else if (e.tanker.role === ROLE.HERO) {
                if (_this.available) {

                    // 玩家被杀。。。有可能同时多个子弹打中玩家，只需要让一个子弹的生效就好了。
                    if (_this.tanker.tank.status === GAME_STATUS.NORMAL) {
                        _this.tanker.tank.onHeroKill();
                    }
                }
            }

            // 然后让子弹消失。
            _this.available = false;
            if (_this.onUnAvailable) {
                _this.onUnAvailable(_this);
            }
        } else if (e.message === "hited") {
            // 只是打到了，但是没有形成伤害的攻击，比如说打到了boss的身体，就是这种。
            // 子弹打到了别人的子弹，也是这种。情况。
            // 然后让子弹消失。
            _this.available = false;
            if (_this.onUnAvailable) {
                _this.onUnAvailable(_this);
            }
        } else {
            console.warn("异常：", e);
        }
    }
}


/**
 * 坦克类
 * @param offsetRow 行偏移量
 * @param offsetCol 列偏移量 (行列偏移量都是相对于左上角的点来说的)
 * @param role 坦克角色
 * @param direction 坦克方向
 * @constructor
 */
function Tanker(offsetRow, offsetCol, role, direction, tank) {
    // 坦克大小就3×3的的。
    this.width         = 3;
    this.height        = 3;
    this.offsetRow     = offsetRow;
    this.offsetCol     = offsetCol;
    this.role          = role;
    this.direction     = direction;
    this.balls         = [];            // 子弹列表
    this.tank          = tank;          // 游戏实列
    this.launch        = tank.launch;   // 启动器实列。

    // 如果坦克是英雄角色(就是玩家)，那么这个坦克中心的点阵会不停的闪烁，以方便识别这是英雄。
    // 此字段表示闪烁的间隔时间。（毫秒）
    this.heropointtime = 20;

    this.initAtoms();

    this.init();
}

/**
 * 一些初始化。
 */
Tanker.prototype.init = function () {
    // 针对敌方坦克，随机的在一出来就发出一个子弹。
    if (this.role === ROLE.FOE) {
        if (WzwScreen.random(0, 10) > 6) {
            this.shoot();
        }
    }
};

/**
 * 初始化坦克的点阵。这个点阵会根据坦克的方向进行初始化/
 */
Tanker.prototype.initAtoms = function (){
    switch (this.direction) {
        case DIRECTION.UP:
            this.atoms = DIRECTION.UP_ARR();
            break;
        case DIRECTION.RIGHT:
            this.atoms = DIRECTION.RIGHT_ARR();
            break;
        case DIRECTION.BOTTOM:
            this.atoms = DIRECTION.BOTTOM_ARR();
            break;
        case DIRECTION.LEFT:
            this.atoms = DIRECTION.LEFT_ARR();
            break;
        default:throw new Error("不支持的方向");
    }
};

/**
 *  应用点阵。此方法在游戏的 onUpdate 方法里被调用，目的在于将坦克本身放入点阵数组里面，
 *  这样在渲染的时候就可以把坦克显示出来了。
 * @param atoms
 */
Tanker.prototype.applyAtom = function (atoms) {
    for (let i = 0; i < this.height; i++) {
        for (let j = 0; j < this.width; j++) {
            if (i===1 && j===1) {
                atoms[this.offsetRow + i][this.offsetCol + j] = this.atoms[i][j];
            } else if (this.atoms[i][j] === 1) {
                atoms[this.offsetRow + i][this.offsetCol + j] = this.atoms[i][j];
            }
        }
    }

    for (let i = 0; i < this.balls.length; i++) {
        let b = this.balls[i];
        if (b.available) {
            atoms[b.offsetRow][b.offsetCol] = 1;
        }
    }
};

/**
 * 此方法应该在游戏的 onUpdate 调用，不判断任何条件的调用。所以此方法会很快被调用无数次。
 * 对于敌人的更新， 受到关卡的限定，所以不能在这里面进行， 在 updateEOF里面。
 */
Tanker.prototype.update = function () {

    if (this.role === ROLE.HERO) {
        if ((Date.now() - (this.heropointLastTime||0)) >= this.heropointtime) {
            this.atoms[1][1] = (this.atoms[1][1] === 1 ? 0 : 1);

            this.heropointLastTime = Date.now();
        }
    }

    for (let i = 0; i < this.balls.length; i++) {
        if (this.balls[i].available) {
            this.balls[i].update();
        }
    }
};

/**
 * 更新敌人的状态，这里面实现了敌人的自动移动和自动发射子弹。
 */
Tanker.prototype.updateEOF = function (){
    let moveOrTurn = WzwScreen.random(0, 100);
    if (moveOrTurn >= 30) { // 70%
        // 移动一格。
        this.moveTo(this.direction, 1);
    } else {  // 70%
        // 转向
        this.moveTo(this.getDiffDirection(), 1);
    }

    let doShoot = WzwScreen.random(0, 100);
    if (doShoot >= 70) { // 30%
        this.shoot();
    }
};

Tanker.prototype.turnTo = function (direction) {
    this.atoms = DIRECTION.UP_ARR();
    this.direction = DIRECTION.UP;
};

/**
 * 向指定方向移动指定个点阵, 如果当前方向和目标移动方向不一致，则此次调用只会进行转向操作。
 */
Tanker.prototype.moveTo = function(direction, count) {
    switch (direction) {
        case DIRECTION.UP:
            this.moveToUp(count);
            break;
        case DIRECTION.RIGHT:
            this.moveToRight(count);
            break;
        case DIRECTION.BOTTOM:
            this.moveToBottom(count);
            break;
        case DIRECTION.LEFT:
            this.moveToLeft(count);
            break;
        default: throw new Error("未知的方向:" + direction);
    }
};

Tanker.prototype.moveToUp     = function (count, keepDirection) {
    if (this.direction !== DIRECTION.UP && !keepDirection) {
        this.direction = DIRECTION.UP;
        this.atoms = DIRECTION.UP_ARR();
        return;
    }
    if (this.offsetRow <= 0) {
        return;
    }

    if (this.hasTankerOn(DIRECTION.UP)) {
        return;
    }

    this.offsetRow -= count;
};

Tanker.prototype.moveToRight  = function (count, keepDirection) {
    if (this.direction !== DIRECTION.RIGHT && !keepDirection) {
        this.direction = DIRECTION.RIGHT;
        this.atoms = DIRECTION.RIGHT_ARR();
        return;
    }
    if ((this.offsetCol + 2) >= this.launch.screen.option.atomColCount - 1) {
        return;
    }

    if (this.hasTankerOn(DIRECTION.RIGHT)) {
        return;
    }

    this.offsetCol += count;
};

Tanker.prototype.moveToBottom = function (count, keepDirection) {
    if (this.direction !== DIRECTION.BOTTOM && !keepDirection) {
        this.direction = DIRECTION.BOTTOM;
        this.atoms = DIRECTION.BOTTOM_ARR();
        return;
    }
    if ((this.offsetRow + 2) >= this.launch.screen.option.atomRowCount - 1) {
        return;
    }


    if (this.hasTankerOn(DIRECTION.BOTTOM)) {
        return;
    }

    this.offsetRow += count;
};

Tanker.prototype.moveToLeft   = function (count, keepDirection) {
    if (this.direction !== DIRECTION.LEFT && !keepDirection) {
        this.direction = DIRECTION.LEFT;
        this.atoms = DIRECTION.LEFT_ARR();
        return;
    }
    if (this.offsetCol <= 0) {
        return;
    }

    if (this.hasTankerOn(DIRECTION.LEFT)) {
        return;
    }


    this.offsetCol -= count;
};

// 此坦克指定方向边有坦克的话此方法将返回true。
Tanker.prototype.hasTankerOn = function (direction) {
    try {

        let colFlag = 0, rowFlag = 0;
        switch (direction) {
            case DIRECTION.LEFT:   colFlag = -1; break;
            case DIRECTION.UP:     rowFlag = -1; break;
            case DIRECTION.RIGHT:  colFlag =  1; break;
            case DIRECTION.BOTTOM: rowFlag =  1; break;
        }

        let _this = this;
        let sideAtoms = _this.getSideAtoms(direction);
        // 判断此坦克的指定方向边有没有坦克。
        WzwScreen.each(_this.tank.tankers, function (tanker) {
            if (_this !== tanker) {
                WzwScreen.each(sideAtoms, function (atom) {
                    if (tanker.isAtomIn(atom[0] + rowFlag, atom[1] + colFlag)) {
                        throw "yes";
                    }
                });
            }
        });

        // 如果是敌方坦克，记得还要判断别往玩家身上跑
        if (_this.role === ROLE.FOE) {
            WzwScreen.each(sideAtoms, function (atom) {
                if (_this.tank.hreo && _this.tank.hreo.isAtomIn(atom[0] + rowFlag, atom[1] + colFlag)) {
                    throw "yes";
                }
            });
        }

    }catch (e) {
        return true;
    }
    return false;
};

// 获取指定方向边缘的点
Tanker.prototype.getSideAtoms = function (direction) {
    switch (direction) {
        case DIRECTION.LEFT:
            return [
                [this.offsetRow + 0, this.offsetCol + 1],
                [this.offsetRow + 1, this.offsetCol + 0],
                [this.offsetRow + 2, this.offsetCol + 1]
            ];
        case DIRECTION.UP:
            return [
                [this.offsetRow + 1, this.offsetCol + 0],
                [this.offsetRow + 0, this.offsetCol + 1],
                [this.offsetRow + 1, this.offsetCol + 2]
            ];
        case DIRECTION.RIGHT:
            return [
                [this.offsetRow + 0, this.offsetCol + 1],
                [this.offsetRow + 1, this.offsetCol + 2],
                [this.offsetRow + 2, this.offsetCol + 1]
            ];
        case DIRECTION.BOTTOM:
            return [
                [this.offsetRow + 1, this.offsetCol + 0],
                [this.offsetRow + 2, this.offsetCol + 1],
                [this.offsetRow + 1, this.offsetCol + 2]
            ];
    }
}

/**
 * 发射子弹。
 */
Tanker.prototype.shoot = function () {
    let _this = this;

    if (_this.tank.status === GAME_STATUS.KILLED && _this.role === ROLE.HERO) {
        // 玩家被杀了，就不能发射子弹了。
        return;
    }

    if (_this.balls.length >= BALLMAXCOUNT) { // 限定子弹个数。
        return;
    }

    let ball = new Ball(this, function (ball) {
        let i = _this.balls.indexOf(ball);
        if (i <= -1) {return;}
        _this.balls.splice(i, 1);
    });
    _this.balls.push(ball);
}

/**
 * 判断某个点阵是否在这个坦克的范围内。
 */
Tanker.prototype.isAtomIn = function(row, col) {
    if (this.offsetRow <= row && row <= (this.offsetRow + 2)) {
        if (this.offsetCol <= col && col <= (this.offsetCol + 2)) {
            return true;
        }
    }
    return false;
}

/**
 * 检查某点位是否在此坦克发射的子弹同位置。
 * @param row
 * @param col
 */
Tanker.prototype.isAtomInAtom = function(row, col) {
    for (let i = 0; i < this.balls.length; i++) {
        let b = this.balls[i];
        if (!b.available) {
            continue;
        }
        if (b.offsetRow === row && b.offsetCol === col) {
            b.available = false;
            if (b.onUnAvailable) {
                b.onUnAvailable(b);
            }
            return true;
        }
    }
    return false;
}

/**
 * 获取一个和当前坦克方向不一样的其它方向。
 */
Tanker.prototype.getDiffDirection = function () {
    let dirs;
    if (this.direction === DIRECTION.UP) {
        dirs = [DIRECTION.RIGHT, DIRECTION.BOTTOM,DIRECTION.LEFT];
    } else if (this.direction === DIRECTION.RIGHT) {
        dirs = [DIRECTION.LEFT, DIRECTION.BOTTOM,DIRECTION.LEFT];
    } else if (this.direction === DIRECTION.BOTTOM) {
        dirs = [DIRECTION.RIGHT, DIRECTION.UP,DIRECTION.LEFT];
    } else if (this.direction === DIRECTION.LEFT) {
        dirs = [DIRECTION.RIGHT, DIRECTION.BOTTOM,DIRECTION.UP];
    }

    return dirs[WzwScreen.random(0, dirs.length)];
}


// 关卡boss
function TankerBoss(offsetCol, hp, moveStepTime, tank) {
    this.boss      = true;
    this.direction = DIRECTION.BOTTOM;
    this.offsetRow = -8;
    this.offsetCol = offsetCol;
    this.hp        = hp;            // boss 血量
    this.tank      = tank;
    this.launch    = tank.launch;
    this.balls     = [];            // 子弹列表
    this.role      = ROLE.FOE;
    this.fram      = [
        [1,1,0,0,0,1,1],
        [0,1,0,0,0,1,0],
        [1,0,1,1,1,0,1],
        [0,1,1,0,1,1,0],
        [1,0,1,1,1,0,1],
        [0,1,0,1,0,1,0],
        [1,1,0,1,0,1,1],
        [0,0,0,1,0,0,0]
    ];
    this.status    = TankerBoss.STATUS.SHOWING;
    this.moveStepTime = moveStepTime;  // 移动时序长度。
    this.way       = 'left';     // 先向左移动
    this.wayCount  = 1;          // 每次移动1格。

    this.showingStepTime = 100; // 出场时序长度。

}

TankerBoss.prototype.updateAndApply = function (atoms) {
    // 正在出场过程。
    if (this.status === TankerBoss.STATUS.SHOWING) {

        if (Date.now() - (this.lastStepTime||0) >= this.showingStepTime) {
            this.offsetRow += 1;

            if (this.offsetRow >= 0) {
                // 出场完成。
                this.status = TankerBoss.STATUS.SHOWED;
            }
            this.lastStepTime = Date.now();
        }

    } else if (this.status === TankerBoss.STATUS.SHOWED) {
        // 出场完成。进行攻击

        if (Date.now() - (this.lastStepTime || 0) >= this.moveStepTime) {

            // 移动一格。
            if (this.way === 'left') {
                this.offsetCol -= this.wayCount;

                if (this.offsetCol < 0) {// 已经移动到最左边，则开始向右
                    this.way = 'right';
                }
            } if (this.way === 'right') {
                this.offsetCol += this.wayCount;

                if (this.offsetCol + 7 >= this.tank.launch.screen.option.atomColCount) {
                    // 已经移动到最右边，则开始向左移动
                    this.way = 'left';
                }
            } else {
                /* 不可能发生 */
            }

            this.shoot();

            this.lastStepTime = Date.now();
        }
    } else if (this.status === TankerBoss.STATUS.RUNAWAYING) {
        if (Date.now() - (this.lastStepTime||0) >= this.showingStepTime) {
            this.offsetRow -= 1;

            if (this.offsetRow <= -8) {
                // 逃跑完成。
                this.status = TankerBoss.STATUS.RUNAWAYED;
                if (this.onRunAwayFun) {
                    this.onRunAwayFun.call(this);
                }
            }
            this.lastStepTime = Date.now();
        }
    }
    WzwScreen.mergeArr(this.fram, atoms, this.offsetRow, this.offsetCol);
    // 只有在正常状态才更新boss的子弹。这样当boss被打死淘宝时，就可以让其子弹不动。
    if (this.status === TankerBoss.STATUS.SHOWED) {
        for (let i = 0; i < this.balls.length; i++) {
            let b = this.balls[i];
            b.update();
            if (b.available) {
                atoms[b.offsetRow][b.offsetCol] = 1;
            }
        }
    }
};

// 发射
TankerBoss.prototype.shoot = function () {
    let _this = this;
    let ball = new Ball(_this, function (ball) {
        let i = _this.balls.indexOf(ball);
        if (i <= -1) {return;}
        _this.balls.splice(i, 1);
    });
    _this.balls.push(ball);
};

// boss 血量减1
TankerBoss.prototype.hpDown = function () {
    this.hp -= 1;
}

TankerBoss.prototype.getHp = function () {
    return this.hp;
}

// boss被打死之后，逃跑。
TankerBoss.prototype.runAway = function () {
    this.status = TankerBoss.STATUS.RUNAWAYING;
}

// 设置boss被打逃跑后的回调。
TankerBoss.prototype.setOnRunAway = function (fun) {
    this.onRunAwayFun = fun;
}

// 判断某点位是否在boss的枪管位置里，在这个位置里认为是打到了boss。
TankerBoss.prototype.isAtomInGun = function (row, col) {
    if (this.status !== TankerBoss.STATUS.SHOWED) {
        // 还没有完全出场，boss就算中弹也没事。
        return false;
    }

    if (row === (this.offsetRow + 6)) {
        if ((this.offsetCol + 3) === col) {
            return true;
        }
    }
    return false;
}

// 判断某点位是否在boss的身体部分，如果在，返回true，应该让此子弹消失。
TankerBoss.prototype.isAtomIn = function (row, col) {
    if (this.offsetRow <= row && row <= (this.offsetRow + 6)) {
        if (this.offsetCol <= col && col <= (this.offsetCol + 6)) {
            return true;
        }
    }
    return false;
}

TankerBoss.STATUS = {
    SHOWING: 1, // boss正在出场过程。
    SHOWED:  2, // boss出场完毕。
    RUNAWAYING: 3, // boss逃跑中。
    RUNAWAYED:  4, // boss逃跑完毕。
}


// ==============下面是游戏实现代码===============

/**
 * 坦克游戏实现。
 * @constructor
 */
function Tank() {

    initPreview.call(this);
}

// 当游戏实列被注册到launch时调用。
Tank.prototype.onRegLaunch = function (launch) {
    this.launch = launch;
};

Tank.prototype.getPreviewAtoms = function () {
    if (Date.now() - this.preview_lasttime >= this.preview_timespace) {
        this.preview_index++;
        if (this.preview_index >= this.previewAtom.length - 1) {
            this.preview_index = 0;
        }
        this.preview_lasttime = Date.now();
    }
    return this.previewAtom[this.preview_index];
};

// 初始化预览界面。
function initPreview() {

    this.preview_index = 0;
    this.preview_lasttime = Date.now();
    this.preview_timespace = 200;

    // 预览界面是一个row=10，col=11的二维数组。
    this.previewAtom = [
        [
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        ],
        [
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        ],
        [
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
        ],

        [
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
        ],
        [
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0],
        ],
        [
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1],
            [0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
        ],
        [
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
            [0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1],
            [0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
    ];
}

// ===============以上为预览实现==================
//
// ===============以下为玩法实现==================

// 【生命周期函数】当游戏启动时调用。
Tank.prototype.onLaunch = function () {
    initForNewGame.call(this);
};

// 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
Tank.prototype.onUpdate = function () {

    // 暂停了就什么逻辑都不执行，直接返回。
    if (this.status === GAME_STATUS.PAUSED) {
        return this.atoms;
    }

    // 游戏二维数组
    this.atoms = this.launch.screen.makeNewArr();

    // boss
    if (this.bossMod) {
        if (this.boss) {
            this.boss.updateAndApply(this.atoms);
        }
    } else {
        // 有boss的情况下其它小兵就别搅和了。

        if (this.tankers) {
            for (let i = 0; i < this.tankers.length; i++) {
                this.tankers[i].update();
                this.tankers[i].applyAtom(this.atoms);
            }
        }

        // 敌人的运行速度受关卡限定，关卡越搞，速度越快。
        if ((Date.now() - (this.gameLastTime || 0)) >= LEVELS[this.level]) {

            makeaFOE.call(this);

            if (this.tankers) {
                for (let i = 0; i < this.tankers.length; i++) {
                    this.tankers[i].updateEOF();
                }
            }

            this.gameLastTime = Date.now();
        }
    }


    if (this.hreo) {
        this.hreo.update();

        this.hreo.applyAtom(this.atoms);
    }

    // 玩家被杀了。的爆炸效果
    if (this.bomb && this.status === GAME_STATUS.KILLED) {
        this.bomb.update();

        WzwScreen.mergeArr(this.bomb.getCurrentFrame(), this.atoms, this.bomb.offsetRow, this.bomb.offsetCol);
    }

    return this.atoms;
};

// 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
Tank.prototype.onUpdateStatus = function () {
    return this.lifes;
};

// 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
Tank.prototype.onDestroy = function () {
    this.hreo    = undefined;
    this.score   = 0;
    this.level   = 0;
    this.tankers = [];
    this.bomb    = undefined;
    this.status  = GAME_STATUS.GAMEOVER;
    this.boss    = undefined;
    this.bossMod = false;
    this.best    = 0;

    this.launch.screen.setBest(0);
    this.launch.screen.setScore(0);
    this.launch.screen.setLevel(0);
    this.launch.screen.setPause(false);
};

// 【事件函数】当某按键抬起时调用
Tank.prototype.onKeyup = function (key) {
    if (key === "start") {
        if (this.status === GAME_STATUS.PAUSED) {
            this.status = this.oldStatus;
            this.launch.screen.setPause(false);
        } else {
            this.oldStatus = this.status;
            this.status = GAME_STATUS.PAUSED;
            this.launch.screen.setPause(true);
        }
    }
};

// 【事件函数】当某按键按下时调用
Tank.prototype.onKeyDown = function (key) {
    if (!this.hreo) {return;}
    if (this.autoMoving) {return;} // 打boss前有个自动向boss对面移动的过程，此过程不允许被干预。
    if (this.status === GAME_STATUS.PAUSED) {return;} // 暂停了

    if (key === "up") {
        if (this.bossMod) return;
        this.hreo.moveToUp(1);
    } else if (key === "right") {
        this.hreo.moveToRight(1, !!this.bossMod);
    } else if (key === "down") {
        if (this.bossMod) return;
        this.hreo.moveToBottom(1);
    } else if (key === "left") {
        this.hreo.moveToLeft(1, !!this.bossMod);
    } else if (key === "rotate") {
        this.hreo.shoot();
    }
};

// 使玩家自动跑到某位在，默认跑到打boss的对面，也就是最下面的中间。
Tank.prototype.goto = function (target, cb/*到达目的地时回调此方法*/) {
    let dely = 100;

    let _this = this;

    _this.autoMoving = true;

    function move() {
        if (_this.hreo.offsetCol !== target[1]) {
            // console.log("col");
            if (_this.hreo.offsetCol < target[1]) {
                _this.hreo.moveToRight(1);
                setTimeout(move, dely);
                return;
            } else if (_this.hreo.offsetCol > target[1]) {
                _this.hreo.moveToLeft(1);
                setTimeout(move, dely);
                return;
            }
        } else if (_this.hreo.offsetRow !== target[0]) {
            // console.log("row");
            if (_this.hreo.offsetRow < target[0]) {
                _this.hreo.moveToBottom(1);
                setTimeout(move, dely);
                return;
            } else if (_this.hreo.offsetRow > target[0]) {
                _this.hreo.moveToUp(1);
                setTimeout(move, dely);
                return;
            }
        } else {
            // console.log("end");
            cb && cb.call(_this);
            _this.autoMoving = false;
        }
    }
    setTimeout(move, dely * 2);
};

/**
 * 当敌人被杀时调用。
 */
Tank.prototype.onEofKill = function () {
    this.score += 1;
    this.shotCount += 1;
    this.launch.screen.setScore(this.score);
    if (this.score >= this.best) {
        this.best = this.score;
        this.launch.screen.setBest(this.best);
        WzwScreen.storeSet("tankBest", this.best);
    }

    // 满足提升管卡要求？
    if (this.shotCount >= SHOOT_LEVELS[String(this.level)]) {
        this.levelUp();
    }
};

/**
 * 提升关卡
 */
Tank.prototype.levelUp = function () {
    let _this = this;

    // 打boss模式
    _this.bossMod = true;

    // 打boss时去掉其它坦克。
    _this.tankers = [];

    // 然后去到界面底部。
    _this.goto([
        this.launch.screen.option.atomRowCount - 3,
        parseInt(((this.launch.screen.option.atomColCount - 1) / 2)-1),
    ], function () {

        // 矫正玩家方向。
        _this.hreo.turnTo(DIRECTION.UP);

        // 然后出现boss。
        _this.boss = new TankerBoss(2, (_this.level + 3), 460, _this);

        // 当boss被打死后此方法执行。
        _this.boss.setOnRunAway(function () {
            _this.level += 1;
            _this.shotCount = 0; // 击打的敌机个数，每个关卡都会从0开始
            _this.launch.screen.setLevel(_this.level);
            _this.boss = undefined;

            // boss跑了后，自动将玩家坦克移动到屏幕中间。
            _this.goto([
                parseInt(((this.launch.screen.option.atomRowCount - 1) / 2)-1),
                parseInt(((this.launch.screen.option.atomColCount - 1) / 2)-1),
            ], function () {
                _this.bossMod = false;
            });

        });

    })
}

/**
 * boss 被打中一次此方法调用一次，所以此方法并不是方法名那样boss被杀了，而是boss挨了一颗子弹。
 */
Tank.prototype.onBossKill = function () {
    this.boss.hpDown();

    if (this.boss.getHp() <= 0) {
        // boss 没血了。
        this.boss.runAway(); //
    }
};

/**
 * 当玩家被杀时调用。
 */
Tank.prototype.onHeroKill = function() {
    this.status = GAME_STATUS.KILLED;
    let _this = this;
    _this.bomb = new WzwBomb({
        offsetRow: _this.hreo.offsetRow,
        offsetCol: _this.hreo.offsetCol,
        onEnd: function () {
            startForNewHreo.call(_this);
        }
    });

    this.hreo = undefined;
}

/**
 * 初始化，此方法应该在开始一局全新的游戏时调用。
 */
function initForNewGame() {

    this.level = 0;
    this.shotCount = 0; // 击打的敌机个数，每个关卡都会从0开始
    this.score = 0;
    this.best = WzwScreen.storeGet('tankBest') || 0;
    this.launch.screen.setBest(this.best);

    // 初始化有3条命。同时正好使用这个来渲染右侧的小点阵，来表示用户还有几条命。
    this.lifes = [[0,0,0,0]];
    this.lifeCount = 3;
    for (let i = 0; i < this.lifeCount; i++) {
        this.lifes.push([1,1,1,1]);
    }

    startForNewHreo.call(this);
}

// 每新使用一个玩家，都是用此方法进行回合重启。
function startForNewHreo() {

    this.bomb = undefined;

    // 使用玩家的生命数创建一个英雄。
    this.hreo = useaHero.call(this);

    if (!this.hreo) {
        // 执行到这里如果没有玩家，说明玩家生命数已经耗尽。结束游戏。
        this.status = GAME_STATUS.GAMEOVER;
        doGameOver.call(this);
        return;
    }

    // 敌方坦克集合
    this.tankers = [];

    this.status = GAME_STATUS.NORMAL;
}

/**
 * 使用一个玩家。此方法调用一次，就从玩家的所有命数中取一条命。当此方法返回null时，没有生命了。
 */
function useaHero () {

    // 已经用光了所有的命数。
    if (this.lifeCount <= 0) {
        return null;
    }

    this.lifeCount = this.lifeCount - 1;

    // 更新命数指示点阵。
    for (let i = 0; i < 4 - this.lifeCount; i++) {
        this.lifes[i] = [0,0,0,0];
    }

    let r = 9, c = 4;
    if (this.bossMod) {
        r = this.launch.screen.option.atomRowCount - 3;
        c = 0;
    }

    return new Tanker(r, c, ROLE.HERO, DIRECTION.UP, this);
}

/**
 * 随机从屏幕的四个角落产生敌方坦克。
 */
function makeaFOE() {

    // 屏幕上最多3个坦克。
    if (this.tankers.length >= 3) {
        return;
    }

    let pss = findEOFAvailablePosition.call(this, this.tankers, this.hreo);
    let ps = pss[WzwScreen.random(0, pss.length)];

    if (ps === 'top_left') {
        this.tankers.push(new Tanker(0, 0, ROLE.FOE, DIRECTION.BOTTOM, this));
    } else if (ps === 'top_right') {
        this.tankers.push(new Tanker(0, this.launch.screen.option.atomColCount-3, ROLE.FOE, DIRECTION.BOTTOM, this));
    } else if (ps === 'bottom_left') {
        this.tankers.push(new Tanker(this.launch.screen.option.atomRowCount-3, 0, ROLE.FOE, DIRECTION.UP, this));
    } else if (ps === 'bottom_right') {
        this.tankers.push(new Tanker(this.launch.screen.option.atomRowCount-3, this.launch.screen.option.atomColCount-3, ROLE.FOE, DIRECTION.UP, this));
    }
}

/**
 * 寻找适合产生敌方坦克的位置。 这个方法返回一个数组。
 * ['top_left', 'top_right',...]
 *
 * 传入现有的敌方坦克和玩家坦克，以确定它们是否占据了即将要产生的新坦克的位置。
 */
function findEOFAvailablePosition (tankers, hero) {
    let resul_t = [];

    // 判断上左
    let topLeftJudgeArr = this.topLeftJudgeArr = this.topLeftJudgeArr || [
        [0, 2],
        [1, 2],
        [2, 2],
        [2, 0],
        [2, 1],
    ];

    if (!judgeArrHasTanker(topLeftJudgeArr, tankers, hero)) {
        resul_t.push('top_left');
    }

    // 判断上右
    let topRightJudgeArr = this.topRightJudgeArr = this.topRightJudgeArr || [
        [0, this.launch.screen.option.atomColCount - 3],
        [1, this.launch.screen.option.atomColCount - 3],
        [2, this.launch.screen.option.atomColCount - 3],
        [2, this.launch.screen.option.atomColCount - 2],
        [2, this.launch.screen.option.atomColCount - 1],
    ];
    if (!judgeArrHasTanker(topRightJudgeArr, tankers, hero)) {
        resul_t.push('top_right');
    }

    // 判断下左
    let bottomLeftJudgeArr = this.bottomLeftJudgeArr = this.bottomLeftJudgeArr || [
        [this.launch.screen.option.atomRowCount - 1, 2],
        [this.launch.screen.option.atomRowCount - 2, 2],
        [this.launch.screen.option.atomRowCount - 3, 2],
        [this.launch.screen.option.atomRowCount - 3, 1],
        [this.launch.screen.option.atomRowCount - 3, 0],
    ];
    if (!judgeArrHasTanker(bottomLeftJudgeArr, tankers, hero)) {
        resul_t.push('bottom_left');
    }

    // 判断下右
    let bottomRightJudgeArr = this.bottomRightJudgeArr = this.bottomRightJudgeArr || [
        [this.launch.screen.option.atomRowCount - 1, this.launch.screen.option.atomColCount - 3],
        [this.launch.screen.option.atomRowCount - 2, this.launch.screen.option.atomColCount - 3],
        [this.launch.screen.option.atomRowCount - 3, this.launch.screen.option.atomColCount - 3],
        [this.launch.screen.option.atomRowCount - 3, this.launch.screen.option.atomColCount - 2],
        [this.launch.screen.option.atomRowCount - 3, this.launch.screen.option.atomColCount - 1],
    ];
    if (!judgeArrHasTanker(bottomRightJudgeArr, tankers, hero)) {
        resul_t.push('bottom_right');
    }

    return resul_t;
}

function judgeArrHasTanker (judgeArr, tankers, hero) {
    for (let j = 0; j < judgeArr.length; j++) {
        for (let i = 0; i < tankers.length; i++) {

            // 某个坦克里包含了这个点阵。
            if (tankers[i].isAtomIn(judgeArr[j][0], judgeArr[j][1])) {
                return true;
            }
        }
        if (hero && hero.isAtomIn(judgeArr[j][0], judgeArr[j][1])) {
            return true;
        }
    }
    return false;
}

function doGameOver () {
    let _this = this;
    _this.status = GAME_STATUS.PAUSED;
    _this.launch.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
        if (index === 0) {
            _this.onDestroy();
            _this.launch.exitCurentGame(); // 退出当前游戏
        }
    });
}

exports.Tank = Tank;
