;(function (window) {

    var WzwScreen = window.WzwScreen;

    /**
     * 游戏启动器。在玩家打开页面时(就认为在开机游戏机)运行的就是这个启动器，启动器里有很多个游戏可以选择， 每个游戏提供了序号，预览动画。
     *
     * 启动器是依赖 WzwScreen 类作为显示依托的。
     * @constructor
     */
    function WzwLauncher(dom, option) {

        // 构建显示器。
        this.screen = new WzwScreen(dom, option);

        // 游戏列表
        this.games = [];

        // 建立绘制数组
        this.atoms = undefined;

        // 当前正在进行的游戏。
        this.currentGame = undefined;

        // 注册逻辑方法。
        this.screen.regLogic(logicUpdate.bind(this));

        this.letterCache = {};


        this.current = 0;

        // 楷鸡
        this.reboot();
    }

    /**
     * 注册一个游戏到启动器里面。
     * @param letter 游戏序号
     * @param game 游戏
     */
    WzwLauncher.prototype.regGame = function (letter, game) {
        this.games.push({
            game: game,
            letter: letter
        });
        game.onRegLaunch(this);
    };

    /**
     * 切换到下一个游戏
     */
    WzwLauncher.prototype.nextGame = function () {
        if (this.currentGame) return; // 当前正在玩一个游戏时不切换。
        if (this.current >= this.games.length - 1) return;
        this.current++;
    }

    /**
     * 切换到上一个游戏
     */
    WzwLauncher.prototype.prevGame = function () {
        if (this.currentGame) return; // 当前正在玩一个游戏时不切换。
        if (this.current <= 0) return;
        this.current--;
    }

    /**
     * 开始当前选中的游戏游戏
     */
    WzwLauncher.prototype.start = function () {
        var _this = this;
        if (!_this.starting) {
            _this.starting = true;
        } else {
            return; // 正在开始某个游戏，动画进行中，不响应其它的start调用。
        }

        if (_this.booted && _this.games.length > 0) {

            // 在没有进行任何游戏的状态才进行游戏开始的调用。
            if (!_this.currentGame) {

                _this.screen.playAnim(WzwScreen.ANIM.COP, function (animName, index) {
                    if (index === 0) {
                        _this.currentGame = _this.games[_this.current].game;
                        _this.starting = false;
                    } else if (index === 1) {
                        _this.currentGame.onLaunch();
                    }
                });
            }
        }
    }

    /**
     * 退出当前正在进行的游戏。
     */
    WzwLauncher.prototype.exitCurentGame = function () {
        var _this = this;
        _this.currentGame = undefined;
    }

    /**
     * 重启，其实就是复位的功能。
     */
    WzwLauncher.prototype.reboot = function () {
        // 播放开机动画
        var _this = this;
        _this.offed = false;
        _this.booting = true;
        _this.booted = false;
        _this.bootingHalf = false;
        _this.screen.playAnim(WzwScreen.ANIM.CIRCLE, function (animName, index) {
            if (index === 0) {
                _this.bootingHalf = true;
                // 此时动画跑满屏了。
                if(_this.currentGame) {
                    _this.currentGame.onDestroy && _this.currentGame.onDestroy();
                }
                _this.currentGame = null; // 清除当前正在玩的游戏。
            } else if (index === 1) {
                _this.booting = false;
                _this.bootingHalf = false;
                _this.booted = true;
            }
        });
    }

    WzwLauncher.prototype.turnOff = function() {
        var _this    = this;
        this.booted  = false;
        this.booting = true;
        this.screen.playAnim(WzwScreen.ANIM.T2B, function (animName, index) {
            if (index === 0) {
                _this.offed = true;
            } else if (index === 1) {
                _this.booting = false;
                _this.current = 0;
                _this.currentGame = null;
            }
        });
    }

    // up       // 按下游戏机"上"按钮
    // right    // 按下游戏机"右"按钮
    // down     // 按下游戏机"下"按钮
    // left     // 按下游戏机"左"按钮
    // rotate   // 按下游戏机"旋转"按钮，就是最大的那个按键。
    // start    // 按下游戏机"开始"按钮
    // voice    // 按下游戏机"声音"按钮
    // onoff    // 按下游戏机"开关"按钮
    // reset    // 按下游戏机"复位"按钮
    WzwLauncher.prototype.onKeyUp     = function (key) {onKeyUp.call(this, key);}
    WzwLauncher.prototype.onKeyDown = function (key) {onKeyDown.call(this, key);}

    function onKeyDown(key) {

        // 还没开机
        if (!this.booted || this.offed) {
            return;
        }

        // 没有注册任何游戏
        if (!this.games || this.games.length < 1) {
            return;
        }
        if (this.currentGame) {
            this.currentGame.onKeyDown && this.currentGame.onKeyDown(key);
        }
    }

    /**
     * 模拟按下某个按钮
     * @param key
     */
    function onKeyUp(key) {
        // 还没开机
        if (!this.booted || this.offed) {
            if ("onoff" === key) {
                // 按了开机按钮，进行开机。
                this.reboot();
            }
            return;
        }

        // 关机
        if ("onoff" === key) {
            this.turnOff();
            return;
        }

        // 没有注册任何游戏
        if (!this.games || this.games.length < 1) {
            return;
        }

        // 当前在运行游戏。
        if (this.currentGame) {
            this.currentGame.onKeyup && this.currentGame.onKeyup(key);
        } else {
            if ("rotate" === key) {
                // 没开始游戏时，就使用此按钮进行多个游戏间的切换。
                if (this.current >= this.games.length - 1) {
                    this.current = 0;
                } else {
                    this.current ++;
                }
                return;
            } else if ("start" === key) {
                this.start();
                return;
            }
        }

        if ("reset" === key) {
            this.reboot();
            return;
        }

    }


    function logicUpdate () {

        // 已关机。
        if (this.offed) {
            this.screen.updateAtomArr(null);
            this.screen.updateStatusAtoms(null);
            this.screen.setScore(0);
            this.screen.setLevel(0);
            this.screen.setBest(0);
            return;
        }

        // 还没开机，什么都不做，直接返回。
        if (this.booting && !this.bootingHalf) {
            return;
        }

        // 如果没有注册任何游戏，则显示无游戏提示。
        if (!this.games || this.games.length <= 0) {
            this.atoms = getEmptyAtoms.call(this);
            this.screen.updateAtomArr(this.atoms);
            this.screen.updateStatusAtoms(null);
            return;
        }

        // 如果正在玩某个游戏，则直接渲染这个游戏。
        if (this.currentGame) {
            this.atoms = this.currentGame.onUpdate();
            this.statusAtoms = this.currentGame.onUpdateStatus();
        } else {
            // 没有正在玩游戏，则渲染这个游戏的预览界面。
            // 使用当前选中的游戏进行预览渲染。
            this.atoms = getPreviewAtoms.call(this);
        }



        this.screen.updateAtomArr(this.atoms);
        this.screen.updateStatusAtoms(this.statusAtoms);
    }

    // 没有注册任何游戏时，显示的无游戏提示。
    function getEmptyAtoms () {
        if (this.emptyArr) {
            return this.emptyArr;
        }

        var _this = this;
        var flag = Math.floor(_this.screen.option.atomRowCount / 2) - 4;
        this.emptyArr = _this.screen.makeNewArr(function (row, col) {
            if (row < flag || row >=  _this.screen.option.atomRowCount - flag) {
                return 1;
            } else {
                return 0;
            }
        });
        WzwScreen.mergeArr(WzwScreen.LETTER["M"], _this.emptyArr, flag + 1, 2);
        console.log("目前还没有注册任何游戏。");
        return this.emptyArr;
    }

    // 获取当前选中的游戏的预览点阵。
    function getPreviewAtoms () {
        // 预览界面分为上下两部分，上面为黑色背景，白色文字，渲染游戏序号。
        // 下面为游戏内容预览界面。
        var _this = this;

        var game = _this.games[this.current];
        var preAtoms = _this.letterCache[game.letter];
        var flag = Math.floor(_this.screen.option.atomRowCount / 2);
        if (!preAtoms) {
            var letterArr = WzwScreen.LETTER[game.letter];
            preAtoms = _this.screen.makeNewArr(function (row, col) {
                if (row <= flag) {
                    var positionRow = row - 3;
                    var positionCol = col - 3;
                    if (letterArr.length > positionRow && positionRow > -1 && letterArr[positionRow].length > positionCol && positionCol > -1) {
                        return letterArr[positionRow][positionCol] === 0 ? 1 : 0;
                    } else {
                        return 1;
                    }
                } else {
                    return 0;
                }
            });
            _this.letterCache[game.letter] = preAtoms;
        }

        // 从游戏本身上面获取游戏预览效果。
        WzwScreen.mergeArr(game.game.getPreviewAtoms(), preAtoms, flag + 1, 0);

        return preAtoms;
    }

    window.WzwLauncher = WzwLauncher;

})(window);
