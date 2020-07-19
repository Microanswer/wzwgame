;(function (window) {

    var WzwScreen = window.WzwScreen;
    var WzwBomb = window.WzwBomb;

    // 蛇的方向，有：上、下、左、右
    var DIRECTION = {
        UP: 1,
        RIGHT: 2,
        BOTTOM: 3,
        LEFT: 4
    };

    // 极速模式的时间长度
    var TURBO_TINESPACE = 30;

    // 正常游戏的时间长度
    var TIMESPACE = 320;

    /**
     * 蛇节点类。
     * @param offsetRow
     * @param offsetCol
     * @param direction // 头节点赋值这个
     * @param pre  // 身体节点赋值这个，pre是此节点的上一个节点。
     * @param next
     * @constructor
     */
    function SnakeNode(offsetRow, offsetCol, direction, pre/*SnakeNode*/, next/*SnakeNode*/) {
        this.offsetRow = offsetRow;
        this.offsetCol = offsetCol;
        this.direction = direction;
        this.pre  = pre;
        this.next = next;
    }

    // 吃到食物时，使用此方法。将食物放入链表
    SnakeNode.prototype.pushFood = function(food) {
        this.food = food;
    };

    // 更新此节点。 此方法返回true，表示蛇还活着。返回false表示蛇挂了(撞墙、吃到自己。。。)
    SnakeNode.prototype.update = function () {

        // 蛇存在下一个节点，则唤醒其更新。在没有食物时后面的跟着前进，在有食物的时候头部涨一格，以达到变长的效果。
        // 所以如果有食物的情况，就仅仅更新头部，而不更新后面的。
        if (!this.food) {
            if (this.next) {
                this.next.update();
            }
        } else {

            var body1 = this.next;
            this.next = new SnakeNode(this.food[0], this.food[1], undefined, this, body1);
            body1.pre = this.next;

            this.food = undefined;
        }

        // 蛇的下一个前进方向根据此节点的上一个节点的位子确定。
        if (this.pre) {
            // this.direction = this.pre.direction;
            this.offsetRow = this.pre.offsetRow;
            this.offsetCol = this.pre.offsetCol;
        } else {

            if (this.nextDirection) {
                // 存在下一个方向，则应用。
                this.direction = this.nextDirection;
                this.nextDirection = undefined;
            }

            // 更新位置。
            switch (this.direction) {
                case DIRECTION.UP:     this.offsetRow-=1;break;
                case DIRECTION.LEFT:   this.offsetCol-=1;break;
                case DIRECTION.BOTTOM: this.offsetRow+=1;break;
                case DIRECTION.RIGHT:  this.offsetCol+=1;break;
            }
        }
    }

    SnakeNode.prototype.applyAtoms = function (atoms) {
        if (this.next) {
            this.next.applyAtoms(atoms);
        }

        try {
            atoms[this.offsetRow][this.offsetCol] = 1;
        }catch (igonre) {/*这里一定会产生下表越界错误，但没关系，忽略他。*/}
    }

    // 将此节点转弯。
    SnakeNode.prototype.turnTo = function (direction) {
        if (!this.pre) {
            // 只有头节点可以转弯。转弯的时候不可以直接转到对立的方向。
            if (
                (this.direction === DIRECTION.BOTTOM && direction !== DIRECTION.UP) ||
                (this.direction === DIRECTION.LEFT && direction !== DIRECTION.RIGHT) ||
                (this.direction === DIRECTION.RIGHT && direction !== DIRECTION.LEFT) ||
                (this.direction === DIRECTION.UP && direction !== DIRECTION.BOTTOM)
            ) {
                // 下一个方向，在每次更新时会根据此方向去决定下一步的走向。
                this.nextDirection = direction;
            }
        }
    }

    // 判断某点是否在当前节点其当前的子节点中。
    SnakeNode.prototype.isAtomsIn = function(row, col) {
        if (this.offsetRow === row && this.offsetCol === col) {
            return true;
        }
        if (this.next) {
            return this.next.isAtomsIn(row, col);
        } else {
            return false;
        }
    }

    function Snake() {

        this.timeSpace = TIMESPACE;

        this.initPreview();
    }

    // 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
    Snake.prototype.onRegLaunch = function (launch) {
        this.launch = launch;
    };

    // 【生命周期函数】预览，此方法应返回一个二维数组，一个row=10，col=11的二维数组。此方法会不停的被调用。
    Snake.prototype.getPreviewAtoms = function () {
        var arr;
        if ((Date.now() - (this.previewLastTime||0) >= this.previewTimeSpace)) {
            arr = this.previewArr[this.previewIndex];
            this.previewIndex ++;
            if (this.previewIndex >= this.previewArr.length - 1) {
                this.previewIndex = 0;
            }
            this.previewLastTime = Date.now();
        }
        return arr;
    };

    // 【生命周期函数】当游戏启动时调用。
    Snake.prototype.onLaunch = function () {

        var headRow = parseInt(this.launch.screen.option.atomRowCount / 2);
        var headCol = parseInt(this.launch.screen.option.atomColCount / 2);

        // 初始的时候给玩家2个节点，和一个节点头，全部三个节点，节点头会不停的闪烁。
        this.snakeHead = new SnakeNode(headRow, headCol, DIRECTION.UP, undefined, undefined);
        var node1      = new SnakeNode(this.snakeHead.offsetRow + 1, headCol, null, this.snakeHead, undefined);
        this.snakeHead.next = node1;
        node1.next     = new SnakeNode(node1.offsetRow + 1, headCol, null, node1, undefined);

        // 随即产生一个食物。
        this.food = this.makeFood();
        this.live = true;
        this.paused = false;

        this.score = 0;

        this.best = WzwScreen.storeGet('snakeBest') || 0;
        this.launch.screen.setBest(this.best);
    };

    // 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
    Snake.prototype.onUpdate = function () {

        this.atoms = this.launch.screen.makeNewArr();

        if (this.snakeHead) {

            // 蛇的更新是一步一步的。
            if (Date.now() - (this.gameLastTime || 0) > (this.turbo ? TURBO_TINESPACE : this.timeSpace)) {

                // 判断玩家吃到了食物。
                if (this.food) {
                    if (this.snakeHead.isAtomsIn(this.food[0], this.food[1])) {

                        this.score += 1;
                        this.launch.screen.setScore(this.score);
                        if (this.score >= this.best) {
                            this.best = this.score;
                            this.launch.screen.setBest(this.best);
                            WzwScreen.storeSet("snakeBest", this.best);
                        }

                        this.snakeHead.pushFood(this.food);

                        // 产生新的食物。
                        this.food = this.makeFood();
                    }
                }

                if (this.live && !this.paused) {
                    this.snakeHead.update();
                }

                // 判断蛇挂了没。
                if (
                    /*咬到自己*/this.snakeHead.next.isAtomsIn(this.snakeHead.offsetRow, this.snakeHead.offsetCol) ||
                    /*跑出屏幕*/this.snakeHead.offsetRow < 0 || this.snakeHead.offsetCol < 0 ||
                    this.snakeHead.offsetRow >= this.launch.screen.option.atomRowCount ||
                    this.snakeHead.offsetCol >= this.launch.screen.option.atomColCount
                ) {
                    this.live = false;
                }

                // 挂了。
                if (!this.live && !this.bomb) {
                    var _this = this;
                    this.bomb = new WzwBomb({
                        offsetRow: _this.snakeHead.offsetRow - 2,
                        offsetCol: _this.snakeHead.offsetCol - 2,
                        onEnd: function () {
                            _this.uiGameover();
                        }
                    });
                }

                this.gameLastTime = Date.now();
            }

            // 但蛇的绘制是迅速的。
            if (this.atoms) {
                if (this.food) {

                    if (Date.now() - (this.foodLastTime || 0) > 60) {
                        this.atoms[this.food[0]][this.food[1]] = this.atoms[this.food[0]][this.food[1]] === 1 ? 0 : 1;
                        this.foodLastTime = Date.now();
                    }
                }
                this.snakeHead.applyAtoms(this.atoms);
            }
        }

        if (this.atoms && this.bomb) {
            this.bomb.update();
            WzwScreen.mergeArr(this.bomb.getCurrentFrame(), this.atoms, this.bomb.offsetRow, this.bomb.offsetCol);
        }

        return this.atoms;
    };

    // 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
    Snake.prototype.onUpdateStatus = function () {

    };

    // 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
    Snake.prototype.onDestroy = function (){
        this.launch.screen.setScore(0);
        this.launch.screen.setBest(0);
        this.launch.screen.setPause(false);
        this.launch.screen.setLevel(0);
        this.snakeHead = undefined;
        this.bomb      = undefined;
        this.live      = false;
        this.turbo     = false;
        this.food      = undefined;
        this.paused    = false;
        this.best      = 0;
        this.launch.exitCurentGame(); // 退出当前游戏
    };

    // 【事件函数】当某按键抬起时调用
    Snake.prototype.onKeyup = function (key) {
        if (key === "rotate") {
            this.turbo = false;
        }
    };

    // 【事件函数】当某按键按下时调用
    Snake.prototype.onKeyDown = function (key) {
        if (key === "start") {
            this.paused = !this.paused;
            this.launch.screen.setPause(this.paused);
        }

        if (this.snakeHead) {
            if (this.paused) return;
            switch (key) {
                case "up":     this.snakeHead.turnTo(DIRECTION.UP);     break;
                case "right":  this.snakeHead.turnTo(DIRECTION.RIGHT);  break;
                case "down":   this.snakeHead.turnTo(DIRECTION.BOTTOM); break;
                case "left":   this.snakeHead.turnTo(DIRECTION.LEFT);   break;
                case "rotate": this.turbo = true;                       break;
            }
        }
    }

    /**
     * 初始化预览界面。
     */
    Snake.prototype.initPreview = function () {
        this.previewIndex = 0;
        this.previewTimeSpace = 200;
        this.previewArr = [
               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,1,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,1,1,1,0,0,0,0,0,0],
                [0,0,0,0,1,0,0,0,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,1,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,1,1,1,0,0,0,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,1,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,1,0,0,0],
                [0,1,1,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,1,0,0,0,0,0,1,0,0,0],
                [0,1,1,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,1,1,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,1,1,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,1,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,1,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,1,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,0,1,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,0,1,1,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,1,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,0,1,1,1,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,0,1,1,1,1,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,0,1,1,1,1,1,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],

               [[0,0,0,0,1,1,1,1,1,1,0],
                [0,0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,1,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0]],
        ]
    };

    /**
     * 随机产个食物/
     * @returns {[number, number]}
     */
    Snake.prototype.makeFood = function () {
        var fd =  [
            WzwScreen.random(0, this.launch.screen.option.atomRowCount),
            WzwScreen.random(0, this.launch.screen.option.atomColCount)
        ];

        if (this.snakeHead) {
            while  (this.snakeHead.isAtomsIn(fd[0], fd[1])) {
                fd =  [
                    WzwScreen.random(0, this.launch.screen.option.atomRowCount),
                    WzwScreen.random(0, this.launch.screen.option.atomColCount)
                ];
            }
        }

        return fd;
    }

    Snake.prototype.uiGameover = function () {
        var _this = this;
        this.launch.screen.playAnim(WzwScreen.ANIM.B2T, function (animName, index) {
            if (index === 0) {
                _this.onDestroy();
            }
        });
    };

    window.Snake = Snake;
})(window);