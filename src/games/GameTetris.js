let { WzwScreen } = require("../platform/WzwScreen");
let GAME_STATUS = {
    PLAYING: "playing",  // 正在游戏中
    PAUSE:   "pause",    // 暂停了
    OVER:    "over"      // 游戏结束
}

/* 下降的材料 */
let STUFS = [
    [
        [0, 0, 0, 0], /* 长条 */
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 长条 */
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0]], [

        [0, 1, 0, 0], /* 长条 */
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]], [

        [0, 1, 0, 0], /* 长条 */
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]], [

        // ------------------------------------------------

        [0, 0, 0, 0], /* 四块 */
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 四块 */
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 四块 */
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 四块 */
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [

        // ------------------------------------------------

        [0, 0, 0, 0], /* 翻7 */
        [0, 1, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 翻7 */
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]], [

        [0, 0, 0, 0], /* 翻7 */
        [0, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 翻7 */
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0]], [

        // ------------------------------------------------

        [0, 0, 0, 0], /* 正7 */
        [0, 1, 1, 1],
        [0, 1, 0, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 正7 */
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]], [

        [0, 0, 0, 0], /* 正7 */
        [0, 0, 0, 1],
        [0, 1, 1, 1],
        [0, 0, 0, 0]], [

        [0, 1, 0, 0], /* 正7 */
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [


        // ------------------------------------------------

        [0, 0, 0, 0], /* 土 */
        [0, 1, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 土 */
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0]], [

        [0, 0, 0, 0], /* 土 */
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 土 */
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 0]], [


        // ------------------------------------------------

        [0, 0, 0, 0], /* z */
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* z */
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* z */
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0]], [

        [0, 0, 0, 0], /* z */
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0]], [


        // ------------------------------------------------

        [0, 0, 0, 0], /* 翻z */
        [0, 0, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 翻z */
        [0, 0, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 0, 0]], [

        [0, 0, 0, 0], /* 翻z */
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0]], [

        [0, 0, 0, 0], /* 翻z */
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0]]
];
/* 定义了各个等级下降的速度， 实际上数字用于settimeout时间间隔 */
let LEVELS = [800, 700, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 130, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];

/* 急速模式的时间间隔。 */
let TURBO_TIME_SPACE = 0;
/* 成绩对应等级 */
let SCORE_LEVELS = {
    "50":  1,
    "100": 2,
    "150": 3,
    "200": 4,
    "250": 5,
    "300": 6,
    "350": 7,
    "400": 8,
    "450": 9,
    "500": 10,
    "550": 11,
    "600": 12,
    "700": 13,
    "850": 14,
    "1000": 15,
    "1100": 16,
    "1300": 17,
    "1500": 18,
    "2000": 19,
    "2500": 20,
    "3000": 21,
    "4000": 22,
    "5000": 23
};
let STUFF_OFFSET_ROW = -3;
let STUFF_OFFSET_COL = 3;

/**
 * 王中王游戏实现。
 * @constructor
 */
function Tetris() {
    // 初始化游戏预览。
    initPreview.call(this);

    this.best = WzwScreen.storeGet("tetrisBest") || 0;
}

// 当游戏实列被注册到launch时调用。
Tetris.prototype.onRegLaunch = function (launch) {
    this.launch = launch;
};

Tetris.prototype.getPreviewAtoms = function () {
    if (Date.now() - this.preview_lasttime >= this.preview_timespace) {
        this.preview_index++;
        if (this.preview_index >= this.previewAtom.length - 1) {
            this.preview_index = 0;
        }
        this.preview_lasttime = Date.now();
    }
    return this.previewAtom[this.preview_index];
};

// 重置游戏。
Tetris.prototype.reset = function () {

    // 初始化游戏数组
    this.atoms = this.launch.screen.makeNewArr();

    // 初始化堆砌结果数组
    this.atomsed = this.launch.screen.makeNewArr();

    // 当前等级
    this.level = 0;

    this.succAniming = false;
    this.score = 0;

    this.stuffOffsetRow = STUFF_OFFSET_ROW;
    this.stuffOffsetCol = STUFF_OFFSET_COL;

    this.gameLastTime = 0;

    // 初始状态为游戏结束。
    this.status = GAME_STATUS.OVER;

    this.turbo = false;

    this.launch.screen.setLevel(this.level);
    this.launch.screen.setScore(this.score);
    this.launch.screen.setBest(this.best);
};

Tetris.prototype.turboModeON = function () {
    if (!this.canTurbo) {
        return;
    }
    this.canTurbo = false;
    this.turbo = true;
};

Tetris.prototype.turboModeOFF = function () {
    this.turbo = false;
};

// 游戏启动时调用此方法
Tetris.prototype.onLaunch = function () {
    this.reset();
    this.stuff = getRandomStuff.call(this);
    // 初始化下一个材料
    this.nextStuff = getRandomStuff.call(this);
    this.status = GAME_STATUS.PLAYING;
    this.canTurbo = true;
};

// 此方法会在游戏过程中不停调用。
Tetris.prototype.onUpdate = function () {
    let _this = this;
    if (!_this.atoms) return ;

    // 根据当前游戏等级来更新数据。
    let now = Date.now();
    if (
        (now - _this.gameLastTime) >= (_this.turbo ? TURBO_TIME_SPACE : LEVELS[_this.level]) &&
        (!_this.succAniming) // 正在进行行消减动画时不下落。
    ) {

        if (_this.status === GAME_STATUS.PLAYING) {

            try {
                let isNewCurrStuf = false;

                if (!_this.stuff) {
                    _this.stuff = _this.nextStuff; /* 始终优先从下一个材料获取 */
                    _this.nextStuff = null;
                    isNewCurrStuf = !!_this.stuff;
                }
                if (!_this.stuff) {
                    _this.stuff = getRandomStuff.call(_this); /* 通过下一个材料也没能获取到材料，说明这是游戏刚开始，此处可以直接随机获取一个。 */
                    _this.nextStuff = null;
                    isNewCurrStuf = !!_this.stuff;
                }
                if (!_this.nextStuff) {
                    _this.nextStuff = getRandomStuff.call(_this); /* 产生下一个新材料 */
                    isNewCurrStuf = !!_this.stuff;
                }

                if (isNewCurrStuf) {
                    _this.turboModeOFF(); /*新材料掉下来时关闭急速模式*/
                }


                let isGrounded = _isGrounded.call(_this, _this.stuffOffsetCol, _this.stuffOffsetRow, _this.stuff, _this.atomsed);
                // _this.stuffUsed = merge.call(_this, _this.atoms, _this.stuff, _this.stuffOffsetRow, _this.stuffOffsetCol);
                if (!isGrounded) {
                    // 没有触底。直接下一个。
                    _this.stuffOffsetRow += 1;
                    // 准备新的渲染数组
                    _this.atoms = WzwScreen.mergeArr2(_this.stuff, _this.atomsed, _this.stuffOffsetRow, _this.stuffOffsetCol,
                        function (tarRowIndex, tarColIndex, rowI, colI) {
                            if (_this.stuff[rowI][colI] === 1) {
                                return _this.stuff[rowI][colI];
                            } else {
                                return _this.atomsed[tarRowIndex][tarColIndex];
                            }
                        });
                }

                if (isGrounded){
                    // 已经触底了。讲当前全部材料保存。
                    _this.atomsed = arrCopy(_this.atoms);
                    // 去除正在下降的材料。
                    _this.stuff = undefined;
                    _this.stuffOffsetRow = STUFF_OFFSET_ROW;
                    _this.stuffOffsetCol = STUFF_OFFSET_COL;
                    // 检查行消减
                    checkSuccessLine.call(_this);
                }

            } catch (e) {
                if (e.message === "gameover") {
                    // 游戏结束
                    _this.status = GAME_STATUS.OVER;
                    doGameOver.call(_this);
                } else {
                    console.error(e);
                }
            }

        } else if (_this.status === GAME_STATUS.PAUSE) {
            // 游戏已暂停了。

        } else if (_this.status === GAME_STATUS.OVER) {

        }


        _this.gameLastTime = Date.now();
    }

    return _this.atoms;
};

// 此方法会在游戏过程中不停调用，返回一个4x4的点阵，将绘制在右侧点阵状态里。
Tetris.prototype.onUpdateStatus = function () {
    return this.nextStuff;
};

// 暂停游戏，暂停游戏时不展示下一个材料
Tetris.prototype.pause = function () {
    if (this.status === GAME_STATUS.PLAYING) {
        this.status = GAME_STATUS.PAUSE;
        this.tempNextStuff = this.nextStuff;
        this.nextStuff = null;
        this.launch.screen.setPause(true);
    } else {
        this.status = GAME_STATUS.PLAYING;
        this.nextStuff = this.tempNextStuff;
        this.tempNextStuff = null;
        this.launch.screen.setPause(false);
    }

};

// 此方法在按下对应按钮时会执行。
Tetris.prototype.onKeyup = function (key) {
    let _this = this;
    if ("down" === key) {
        _this.turboModeOFF();
        this.canTurbo = true;
    }
};

// 某个按键按下时调用。
Tetris.prototype.onKeyDown = function(key) {
    let _this = this;
    if ("reset" === key || "start" === key) { // 按下了复位按钮，就让游戏暂停。使得界面不动。
        _this.pause();
    } else if ("left" === key) {
        // 左移动
        if (_this.status === GAME_STATUS.PAUSE) return;
        _moveCurrStuff.call(_this, -1);
    } else if ("right" === key) {
        if (_this.status === GAME_STATUS.PAUSE) return;
        _moveCurrStuff.call(_this, 1);
    } else if ("rotate" === key || "up" === key) {
        if (_this.status === GAME_STATUS.PAUSE) return;
        rotateStuff.call(_this);
    } else if ("down" === key) {
        if (_this.status === GAME_STATUS.PAUSE) return;
        _this.turboModeON();
    }
};

// 此方法当用户按复位时，动画执行到满屏，会调用，游戏应该清除自己的状态。
Tetris.prototype.onDestroy = function () {
    this.reset();
    this.launch.screen.setBest(0);
    this.launch.screen.setScore(0);
    this.launch.screen.setPause(false);
    this.launch.exitCurentGame(); // 退出当前游戏
};

// 游戏结束时执行此方法
function doGameOver() {
    let _this = this;
    _this.launch.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
        if (index === 0) {
            _this.onDestroy();
        }
    });
}

function onScoreChange(score) {
    if (score > this.best) {
        onNewBest.call(this, score);
    }
    this.launch.screen.setScore(score);
}

function onNewBest(score) {
    this.best = score;
    WzwScreen.storeSet("tetrisBest", score);
    this.launch.screen.setBest(score);
}

function onLevelChange(level) {
    this.launch.screen.setLevel(level);
}

/* 检查堆砌成功的行，并进行消除。 */
function checkSuccessLine() {
    let _this = this;

    let successLine = [];

    for (let i = 0; i < _this.atomsed.length; i++) {

        let isSuccess = true;
        for (let j = 0; j < _this.atomsed[i].length; j++) {
            if (_this.atomsed[i][j] !== 1){
                isSuccess = false;
                break;
            }
        }


        /* 成功一行就+1分*/
        if (isSuccess) {
            _this.succAniming = true;
            _this.score += 1;
            successLine.push(i);
        }
    }

    if (successLine.length > 0) {

        /* 如果一次消了4行，再加1分 */
        if (successLine.length >= 4) {
            _this.score += 1;
        }
        onScoreChange.call(_this, _this.score);

        /*提升等级*/
        let newLevel = SCORE_LEVELS[String(_this.score)];
        if (newLevel > _this.level) {
            _this.level = newLevel;
            onLevelChange.call(_this, _this.level);
        }


        // 执行行消减动画。
        // let ended = false;
        // let onAnimEnd = function () {
        //     if (ended) return;
        //     ended = true;
        //
        //     /*动画完成后重整数组，将消除的行上面的依次向下整理*/
        //     while (successLine.length > 0) {
        //         let rowm = successLine.shift();
        //         for (let row = rowm; row >= 1; row--) {
        //             let lastRow = row - 1;
        //             _this.atomsed[row] = [].concat(_this.atomsed[lastRow]);
        //             if (lastRow === 0) {
        //                 _this.atomsed[lastRow] = [];
        //                 WzwScreen.each(_this.launch.screen.option.atomColCount, function (num, numIndex) {
        //                     _this.atomsed[lastRow][numIndex] = 0;
        //                 });
        //
        //             }
        //         }
        //     }
        //     _this.atoms = arrCopy(_this.atomsed);
        //     _this.succAniming = false;
        // };

        let half = Math.floor(_this.launch.screen.option.atomColCount/2);

        // 动画消减行。
        function animCut(tRow, back) {
            WzwScreen.scroll(0, half, {
                goo: function (curr) {
                    // 左半部分动画
                    for (let j = half; j >= half - curr; j--) {
                        if (j < 0) j = 0;
                        _this.atoms[tRow][j] = 0;
                    }

                    // 右半部分。
                    for (let k = half; k < (half + curr) && k < _this.launch.screen.option.atomColCount; k++) {
                        if (k >= _this.launch.screen.option.atomColCount) k=_this.launch.screen.option.atomColCount-1;
                        _this.atoms[tRow][k] = 0;
                    }
                },
                end: function (end) {
                    // 一行被消除完。
                    for (let row = tRow; row >= 1; row--) {
                        let lastRow = row - 1;
                        _this.atoms[row] = [].concat(_this.atomsed[lastRow]);
                        _this.atomsed[row] = [].concat(_this.atomsed[lastRow]);
                        if (lastRow === 0) {
                            _this.atoms[lastRow] = [];
                            _this.atomsed[lastRow] = [];
                            WzwScreen.each(_this.launch.screen.option.atomColCount, function (num, numIndex) {
                                _this.atoms[lastRow][numIndex] = 0;
                                _this.atomsed[lastRow][numIndex] = 0;
                            });
                        }
                    }

                    back && back();
                },
            }, 220)
        }


        function startCut() {
            if (successLine.length > 0) {
                animCut(successLine.pop(), startCut);
                for (let i = 0; i < successLine.length; i++) {
                    successLine[i] = successLine[i] + 1;
                }
            } else {
                // 动画完了。
                _this.succAniming = false;
            }
        }

        startCut();

    }
}

/* 旋转材料。 此方法只有在游戏中有效，可以将正在下落的材料进行顺时针90度旋转。 */
function rotateStuff () {
    let _this = this;
    if (_this.atoms && _this.stuff && GAME_STATUS.PLAYING === _this.status) {
        let temp = [[], [], [], []];

        let oldStuffOffsetCol = _this.stuffOffsetCol;
        // 进行旋转材料
        for (let i = 0; i < _this.stuff.length; i++) {
            for (let j = 0; j < _this.stuff[i].length; j++) {

                let ni = j;
                let nj = _this.stuff.length - 1 - i;
                temp[ni][nj] = _this.stuff[i][j];

                if (_this.stuffOffsetRow + ni < 0) {
                    /* 材料还没下降到屏幕内 */
                    continue;
                }

                if (_this.stuffOffsetRow + ni >= _this.atoms.length) {
                    /*变化会超出屏幕底部，不准变*/
                    return;
                }


                if (_this.stuffOffsetCol + nj >= _this.atoms[0].length) {
                    /*变化会超出屏幕右边，此时看看左边有咩有足够的空间，有的话将材料向左边移动*/
                    _this.stuffOffsetCol = _this.atoms[0].length - nj - 1;
                    // return;
                }

                if (_this.stuffOffsetCol + nj < 0) {
                    /* 变化会超出屏幕左边， 此时将裁量向右移动。 */
                    _this.stuffOffsetCol = 0 - nj;
                }

                /*判断变化后的材料是否和已确定的堆砌产生重叠，产生了则不进行此次变化*/
                if (_this.atomsed[_this.stuffOffsetRow + ni][_this.stuffOffsetCol + nj] === 1) {
                    _this.stuffOffsetCol = oldStuffOffsetCol;
                    return;
                }
            }
        }

        /* 变化了之后，重新赋值数组，让界面变化。 */
        _this.stuff = temp;
        _this.atoms = WzwScreen.mergeArr2(_this.stuff, _this.atomsed, _this.stuffOffsetRow, _this.stuffOffsetCol,
            function (tarRowIndex, tarColIndex, rowI, colI) {
                if (_this.stuff[rowI][colI] === 1) {
                    return _this.stuff[rowI][colI];
                } else {
                    return _this.atomsed[tarRowIndex][tarColIndex];
                }
            });
    }
}

// 合并正在下降的材料。返回true表示此材料被消耗(到底了，或则堆砌到了已堆砌的材料上)
function merge(atoms, stuff, offsetRow, offsetCol) {
    let _this = this;
    let grounded = false;
    WzwScreen.mergeArr(stuff, atoms, offsetRow, offsetCol, function (tarRowIndex, tarColIndex, rowI, colI) {

        let tarVal = atoms[tarRowIndex][tarColIndex];
        let srcVal = stuff[rowI][colI];

        if (tarVal && srcVal) {
            // 发现一处都有点阵，说明这是堆砌到顶部，当前材料已没有合适的位置摆放，直接爆出错误。gameover。
            throw new Error("gameover");
        }

        if (!grounded) {
            // 判断是否触底
            let nexTarRow = tarRowIndex + 1;
            if (srcVal === 1) {
                if (nexTarRow >= _this.launch.screen.option.atomRowCount) {
                    grounded = true;
                } else if (_this.atomsed[nexTarRow][tarColIndex] === 1) {
                    grounded = true;
                }
            }
        }

        return srcVal || tarVal;
    });

    return grounded;
}

/* 移动当前正在掉落的材料。 count 为移动几格，负数则是左移。 */
function _moveCurrStuff (count) {
    let _this = this;
    let targetOffsetX = _this.stuffOffsetCol + count;
    if (_this.atoms && _this.stuff && _this.atomsed && _this.status === GAME_STATUS.PLAYING) {

        for (let i = 0; i < _this.stuff.length; i++) {
            for (let j = 0; j < _this.stuff[i].length; j++) {
                if (_this.stuff[i][j] !== 1) {
                    continue;
                }
                if (targetOffsetX + j < 0) {
                    /* 传入的目标位数会导致移动到屏幕左边的外面。则强制让其在屏幕内。 */
                    targetOffsetX = -j;
                } else if (targetOffsetX + j > _this.atomsed[0].length - 1) {
                    /* 传入的目标位数会导致移动到屏幕右边的外面。则强制让其在屏幕内。 */
                    targetOffsetX = _this.atomsed[0].length - j - 1;
                }

                /* 材料还没完全下降到屏幕内 */
                if (_this.stuffOffsetRow + i < 0) continue;

                /* 判断新位置上是否有材料了，有就不能进行移动 */
                if (_this.atomsed[_this.stuffOffsetRow + i][targetOffsetX + j] === 1) {
                    return;
                }

            }
        }

        // _this.atoms = _this.launch.screen.makeNewArr(function (r, c) {return _this.atomsed[r][c];});
        _this.stuffOffsetCol = targetOffsetX;
        _this.atoms = WzwScreen.mergeArr2(_this.stuff, _this.atomsed, _this.stuffOffsetRow, _this.stuffOffsetCol,
            function (tarRowIndex, tarColIndex, rowI, colI) {
                if (_this.stuff[rowI][colI] === 1) {
                    return _this.stuff[rowI][colI];
                } else {
                    return _this.atomsed[tarRowIndex][tarColIndex];
                }
            });
        //_this.stuffUsed = merge.call(_this, _this.atoms, _this.stuff, _this.stuffOffsetRow, _this.stuffOffsetCol);
        // _this.atoms  _addStuffToGameAtoms(targetOffsetX, stuffOffsetY, currStuff);
    }
}

// 获取一个随机下落的材料
function getRandomStuff() {
    return [].concat(STUFS[WzwScreen.random(0, STUFS.length)]);
}

// 初始化预览界面。
function initPreview () {

    this.preview_index = 0;
    this.preview_lasttime = Date.now();
    this.preview_timespace = 200;

    // 预览界面是一个row=10，col=11的二维数组。
    this.previewAtom = [
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1]],
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1]],
    ];
}

/**
 * 二维数组拷贝
 * */
function arrCopy(src) {
    let temp = [];
    for (let i = 0; i < src.length; i++) {
        temp[i] = [];
        for (let j = 0; j < src[j].length; j++) {
            temp[i][j] = src[i][j];
        }
    }
    return temp;
}

// 判断此元素是否触底,
function _isGrounded(stuffOffsetX, mStuffOffsetY, currStuff, atomsed) {

    let grounded = false;


    /* 判断此元素下降一格后是否触底 */
    w:for (let i = currStuff.length - 1; i >= 0; i--) {
        for (let j = currStuff[i].length - 1; j >= 0; j--) {
            if (currStuff[i][j] !== 1) continue;

            let c_stuffOffsetY = mStuffOffsetY + i;
            if (c_stuffOffsetY < 0) continue;

            let c_stuffOffsetX = stuffOffsetX + j;
            if (c_stuffOffsetX < 0) continue;

            /* 素材达到最低边， 或素材下一个位置有已确认的素材，则认为到底了。 */
            if (c_stuffOffsetY === atomsed.length - 1 || atomsed[c_stuffOffsetY + 1][c_stuffOffsetX] === 1) {
                grounded = true;
            }

            /* 素材本身出现的位置都已经是頂部了，这绝逼是玩家玩到顶了。 */
            if (c_stuffOffsetY === 0 && grounded) {
                /* 游戏结束 */
                throw new Error("gameover");
            }

            if (grounded) {
                break w;
            }
        }
    }

    return grounded;
}

exports.Tetris = Tetris;
