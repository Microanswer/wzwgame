;(function (window) {

    var WzwScreen = window.WzwScreen;

    /**
     * 游戏启动器。在玩家打开页面时(就认为在开机游戏机)运行的就是这个启动器，启动器里有很多个游戏可以选择， 每个游戏提供了序号，预览动画。
     * launcher 接受了来自鼠标、键盘、触摸的所有事件，这些事件将使玩家可以在各个游戏间经行选择，
     * 当玩家选择了了一个游戏后，所有事件将分发给玩家选择的游戏。
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

        // 注册逻辑方法。
        this.screen.regLogic(logicUpdate.bind(this));

        // 播放开机动画
        var _this = this;
        this.screen.playAnim(WzwScreen.ANIM.CIRCLE, function (animName, index) {
            if (index === 0) {
                // 此时动画跑满屏了，立即开机。
                boot.call(_this);
            }
        });
    }

    function logicUpdate () {

        // 还没开机，什么都不做，直接返回。
        if (!this.booted) {
            return;
        }

        // 如果没有注册任何游戏，则显示无游戏提示。
        if (!this.games || this.games.length <= 0) {
            this.atoms = getEmptyAtoms.call(this);
            this.screen.updateAtomArr(this.atoms);
            return;
        }

    }

    function boot() {
        this.booted = true;
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

    window.WzwLauncher = WzwLauncher;

})(window);
