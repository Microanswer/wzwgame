;(function (window) {

    var WzwScreen = window.WzwScreen;
    var GAME_STATUS = {
        PLAYING: "playing",  // 正在游戏中
        PAUSE:   "pause",    // 暂停了
        OVER:    "over"      // 游戏结束
    }
    var STUFS = [
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
    var LEVELS = [800, 700, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 130, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];

    /* 成绩对应等级 */
    var SCORE_LEVELS = {
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
    var STUFF_OFFSET_ROW = -3;
    var STUFF_OFFSET_COL = 3;

    /**
     * 王中王游戏实现。
     * @constructor
     */
    function Tetris() {
        // 初始化游戏预览。
        initPreview.call(this);
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

        this.stuffOffsetRow = STUFF_OFFSET_ROW;
        this.stuffOffsetCol = STUFF_OFFSET_COL;

        this.gameLastTime = 0;

        // 初始状态为游戏结束。
        this.status = GAME_STATUS.OVER;
    };

    // 游戏启动时调用此方法
    Tetris.prototype.onLaunch = function () {
        this.reset();
        this.stuff = getRandomStuff.call(this);
        // 初始化下一个材料
        this.nextStuff = getRandomStuff.call(this);
        this.status = GAME_STATUS.PLAYING;
    };

    // 此方法会在游戏过程中不停调用。
    Tetris.prototype.onUpdate = function () {
        var _this = this;
        if (!_this.atoms) return ;

        // 根据当前游戏等级来更新数据。
        var now = Date.now();
        if ((now - _this.gameLastTime) >= LEVELS[_this.level]) {
            _this.launch.screen.setLevel(_this.level);
            // _this.atoms = _this.launch.screen.makeNewArr(function (r, c) {
            //     return _this.atomsed[r][c];
            // });

            if (_this.status === GAME_STATUS.PLAYING) {

                try {
                    var isNewCurrStuf = false;

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
                        // turboModeOFF(); /*新材料掉下来时关闭急速模式*/
                    }


                    var isGrounded = _isGrounded.call(_this, _this.stuffOffsetCol, _this.stuffOffsetRow, _this.stuff, _this.atomsed);
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

    }

    // 此方法在按下对应按钮时会执行。
    Tetris.prototype.onKeypress = function (key) {
        var _this = this;
        // 按下了复位按钮，就让游戏暂停。使得界面不动。
        if ("reset" === key || "start" === key) {
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
        }
    }

    // 此方法当用户按复位时，动画执行到满屏，会调用，游戏应该清除自己的状态。
    Tetris.prototype.onDestroy = function () {
        this.reset();
        this.launch.screen.setPause(false);
        this.launch.exitCurentGame(); // 退出当前游戏
    }

    // 游戏结束时执行此方法
    function doGameOver() {
        var _this = this;
        _this.launch.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
            if (index === 0) {
                _this.onDestroy();
            }
        });
    }

    /* 旋转材料。 此方法只有在游戏中有效，可以将正在下落的材料进行顺时针90度旋转。 */
    function rotateStuff () {
        var _this = this;
        if (_this.atoms && _this.stuff && GAME_STATUS.PLAYING === _this.status) {
            var temp = [[], [], [], []];

            // 进行旋转材料
            for (var i = 0; i < _this.stuff.length; i++) {
                for (var j = 0; j < _this.stuff[i].length; j++) {

                    var ni = j;
                    var nj = _this.stuff.length - 1 - i;
                    temp[ni][nj] = _this.stuff[i][j];

                    if (_this.stuffOffsetRow + ni < 0) {
                        /* 材料还没下降到屏幕内 */
                        continue;
                    }

                    if (_this.stuffOffsetRow + ni >= _this.atoms.length) {
                        /*变化会超出屏幕，不准变*/
                        return;
                    }

                    if (_this.stuffOffsetCol + nj >= _this.atoms[0].length || _this.stuffOffsetCol + nj < 0) {
                        return;
                    }


                    /*判断变化后的材料是否和已确定的堆砌产生重叠，产生了则不进行此次变化*/
                    if (_this.atomsed[_this.stuffOffsetRow + ni][_this.stuffOffsetCol + nj] === 1) {
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
        var _this = this;
        var grounded = false;
        WzwScreen.mergeArr(stuff, atoms, offsetRow, offsetCol, function (tarRowIndex, tarColIndex, rowI, colI) {

            var tarVal = atoms[tarRowIndex][tarColIndex];
            var srcVal = stuff[rowI][colI];

            if (tarVal && srcVal) {
                // 发现一处都有点阵，说明这是堆砌到顶部，当前材料已没有合适的位置摆放，直接爆出错误。gameover。
                throw new Error("gameover");
            }

            if (!grounded) {
                // 判断是否触底
                var nexTarRow = tarRowIndex + 1;
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
        var _this = this;
        var targetOffsetX = _this.stuffOffsetCol + count;
        if (_this.atoms && _this.stuff && _this.atomsed && _this.status === GAME_STATUS.PLAYING) {

            for (var i = 0; i < _this.stuff.length; i++) {
                for (var j = 0; j < _this.stuff[i].length; j++) {
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
        var temp = [];
        for (var i = 0; i < src.length; i++) {
            temp[i] = [];
            for (var j = 0; j < src[j].length; j++) {
                temp[i][j] = src[i][j];
            }
        }
        return temp;
    }

    // 判断此元素下降一格后是否触底,
    function _isGrounded(stuffOffsetX, mStuffOffsetY, currStuff, atomsed) {

        var grounded = false;


        /* 判断此元素下降一格后是否触底 */
        w:for (var i = currStuff.length - 1; i >= 0; i--) {
            for (var j = currStuff[i].length - 1; j >= 0; j--) {
                if (currStuff[i][j] !== 1) continue;

                var c_stuffOffsetY = mStuffOffsetY + i;
                if (c_stuffOffsetY < 0) continue;

                var c_stuffOffsetX = stuffOffsetX + j;
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

    window.Tetris = Tetris;
})(window);
