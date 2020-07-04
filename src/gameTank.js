;(function (window) {

    var WzwScreen = window.WzwScreen;

    var BALLMAXCOUNT = 3;

    // 各个等级下的更新速度，坦克(敌方)的运动速度
    var LEVELS = [550, 500, 450, 400, 350, 300, 250, 200, 150, 130, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];

    // 角色，就两种， 敌方和我放
    var ROLE = {
        HERO: 1, // 我方
        FOE: 2   // 敌方
    };

    // 坦克\子弹的方向，有：上、下、左、右
    var DIRECTION = {
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
        this.time = 20;

        this.available = true;

        this.onUnAvailable = onUnAvailable;

        // 初始化子弹的位置，要根据Tanker当前不同的方向来确定子弹初始的位置，所以提取为一个单独方法/
        this.initBallOffset();
    }

    Ball.prototype.initBallOffset = function () {
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
     * 坦克类
     * @param offsetRow 行偏移量
     * @param offsetCol 列偏移量 (行列偏移量都是相对于左上角的点来说的)
     * @param role 坦克角色
     * @param direction 坦克方向
     * @constructor
     */
    function Tanker(offsetRow, offsetCol, role, direction, launch) {
        // 坦克大小就3×3的的。
        this.width         = 3;
        this.height        = 3;
        this.offsetRow     = offsetRow;
        this.offsetCol     = offsetCol;
        this.role          = role;
        this.direction     = direction;
        this.balls         = []; // 子弹列表

        this.launch        = launch;

        // 如果坦克是英雄角色(就是玩家)，那么这个坦克中心的点阵会不停的闪烁，以方便识别这是英雄。
        // 此字段表示闪烁的间隔时间。（毫秒）
        this.heropointtime = 20;

        this.initAtoms();
    }

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
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                if (i===1 && j===1) {
                    atoms[this.offsetRow + i][this.offsetCol + j] = this.atoms[i][j];
                } else if (this.atoms[i][j] === 1) {
                    atoms[this.offsetRow + i][this.offsetCol + j] = this.atoms[i][j];
                }
            }
        }

        for (i = 0; i < this.balls.length; i++) {
            var b = this.balls[i];
            if (b.available) {
                atoms[b.offsetRow][b.offsetCol] = 1;
            }
        }
    };

    /**
     * 此方法应该在游戏的 onUpdate 调用，不判断任何条件的调用。
     */
    Tanker.prototype.update = function () {

        if (this.role === ROLE.HERO) {
            if ((Date.now() - (this.heropointLastTime||0)) >= this.heropointtime) {
                this.atoms[1][1] = (this.atoms[1][1] === 1 ? 0 : 1);

                this.heropointLastTime = Date.now();
            }
        }

        for (var i = 0; i < this.balls.length; i++) {
            if (this.balls[i].available) {
                this.balls[i].update();
            }
        }
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
        this.offsetCol -= count;
    };

    /**
     * 发射子弹。
     */
    Tanker.prototype.shoot = function () {
        var _this = this;
        if (_this.balls.length >= BALLMAXCOUNT) { // 限定子弹个数。
            return;
        }

        var ball = new Ball(this, function (ball) {
            var i = _this.balls.indexOf(ball);
            if (i <= -1) {return;}
            _this.balls.splice(i, 1);
        });
        _this.balls.push(ball);
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
        // 游戏二维数组
        this.atoms = this.launch.screen.makeNewArr();

        if (this.hreo) {
            this.hreo.update();

            this.hreo.applyAtom(this.atoms);
        }

        return this.atoms;
    };

    // 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
    Tank.prototype.onUpdateStatus = function () {
        return this.lifes;
    };

    // 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
    Tank.prototype.onDestroy = function () {};

    // 【事件函数】当某按键抬起时调用
    Tank.prototype.onKeyup = function (key) {};

    // 【事件函数】当某按键按下时调用
    Tank.prototype.onKeyDown = function (key) {
        if (key === "up") {
            this.hreo.moveToUp(1);
        } else if (key === "right") {
            this.hreo.moveToRight(1);
        } else if (key === "down") {
            this.hreo.moveToBottom(1);
        } else if (key === "left") {
            this.hreo.moveToLeft(1);
        } else if (key === "rotate") {
            this.hreo.shoot();
        }
    };

    /**
     * 初始化，此方法应该在开始一局全新的游戏时调用。
     */
    function initForNewGame() {

        // 初始化有3条命。同时正好使用这个来渲染右侧的小点阵，来表示用户还有几条命。
        this.lifes = [[0,0,0,0]];
        this.lifeCount = 3;
        for (var i = 0; i < this.lifeCount; i++) {
            this.lifes.push([1,1,1,1]);
        }

        // 使用玩家的生命数创建一个英雄。
        this.hreo = useaHero.call(this);

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
        for (var i = 0; i < 4 - this.lifeCount; i++) {
            this.lifes[i] = [0,0,0,0];
        }

        return new Tanker(9, 4, ROLE.HERO, DIRECTION.UP, this.launch);
    }

    window.Tank = Tank;
})(window);
