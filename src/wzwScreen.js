;(function (window) {

    var DEFAULT_OPTION = {
        width:         320,           // 游戏屏幕宽度
        height:        430,           // 游戏屏幕高度
        atomRowCount:  20,            // 点阵行数
        atomColCount:  10,            // 点阵列数
        atomBorder:    2,             // 点阵边框大小
        atomInset:     3.5,           // 点阵内空白大小
        atomSpace:     4,             // 点阵间距
        splitPosition: 0.68,          // 左右分隔位置，取值范围:0~1
        splitSize:     1,             // 分割线大小
        fontSize:      16,            // 文字大小
        fontHeight:    20,            // 文字行高
        background:    "#A6AC9F",     // 背景色
        color1:        "#000000",     // 浓颜色
        color2:        "#898989",     // 浅颜色
    };

    var ANIM_TYPE = {
        LINE_BY_LINE: "1",  // 一行一行进行的动画
        ATOM_ATOM:    "2",  // 一个点一个点进行的动画。
    }

    /**
     * 游戏显示屏类。所以游戏都通过使用这个显示器类来实现游戏内容。
     */
    function WzwScreen(dom, option) {

        if (typeof dom === "string") {
            // 认为这是一个选择器
            this.dom = document.querySelector(dom);

        } else if (typeof dom === "object") {
            if (dom.jquery && dom.length > 0) {
                // 认为这时jquery对象。
                this.dom = dom[0];

            } else {
                // 认为这就是一个原生dom。
                this.dom = dom;
            }
        } else {
            throw new Error("未知的选择器。");
        }

        this.option = WzwScreen.assign({}, DEFAULT_OPTION, option || {});

        init.call(this);             // 初始化数据。
        initScreen.call(this);       // 初始化绘画板。

        initRender.call(this);       // 初始化绘制参数，比如说：点阵大小、分割线位置。
        render.call(this);           // 开始绘制。
    }

    /**
     * 重置游戏
     */
    WzwScreen.prototype.reset = function () {
        init.call(this);
    }

    /**
     * 执行指定动画，这些动画需要时来自: WzwScreen.ANIM 里面的。
     * @param anim 某个动画
     * @param cb 当动画执行到满屏时的回调
     * @param cb2 当动画执行完成时的回调
     */
    WzwScreen.prototype.playAnim = function (anim, cb, cb2) {
        var _this = this;
        var animResult = anim.call(_this);

        // 生成动画数组
        var animArr = [];
        WzwScreen.each(_this.option.atomRowCount, function (v, rowIndex) {
            animArr[rowIndex] = [];
            WzwScreen.each(_this.option.atomColCount, function (v2, colIndex) {
                animArr[rowIndex][colIndex] = 0;
            });
        });
        _this.animArr = animArr;

        // 为动画数组动态加入数据，这样绘制的时候就会慢慢显示。
        if (animResult.animType === ANIM_TYPE.ATOM_ATOM) {

            WzwScreen.scroll(0, animResult.animArr.length, {
                goo: function (index) {

                    WzwScreen.each(index, function (va, ind) {
                        var position = animResult.animArr[ind];
                        if (position) {
                            animArr[position[0]][position[1]] = 1;
                        }
                    });

                },
                end: function () {

                    WzwScreen.each(_this.option.atomRowCount, function (v, rowIndex) {
                        _this.atoms[rowIndex] = [];
                        WzwScreen.each(_this.option.atomColCount, function (v2, colIndex) {
                            _this.atoms[rowIndex][colIndex] = 0;
                        });
                    });

                    var backArr = animResult.animArr.reverse();
                    // 再执行反向动画。
                    WzwScreen.scroll(0, backArr.length, {
                        goo: function (index) {
                            WzwScreen.each(index, function (va, ind) {
                                var position = animResult.animArr[ind];
                                if (position) {
                                    animArr[position[0]][position[1]] = 0;
                                }
                            });

                        },
                        end: function () {

                            // 再执行反向动画。
                            _this.animArr = undefined;

                        }
                    }, 2300);


                }
            }, 2300);

        }

    }


    // 初始化数据 - 重置游戏时也可以调用此方法。
    function init() {
        var _this = this;

        // 初始化点阵数据。
        _this.atoms = [];
        WzwScreen.each(_this.option.atomRowCount, function (value, row) {
            _this.atoms[row] = [];
            WzwScreen.each(_this.option.atomColCount, function (value, col) {
                _this.atoms[row][col] = Math.floor(Math.random()*2);
            });
        });

        // 初始化状态数据。
        _this.statusAtoms = [];
        WzwScreen.each(4, function (value, row) {
            _this.statusAtoms[row] = [];
            WzwScreen.each(4, function (value, col) {
                _this.statusAtoms[row][col] = 0;
            });
        });

        this.score  = 0;
        this.paused = false;
        this.level  = 0;
        // this.beast = 0;
    }

    // 初始化屏幕
    function initScreen () {
        var canvasDom = document.createElement("canvas");
        canvasDom.width            = canvasDom.style.width  = this.option.width;
        canvasDom.height           = canvasDom.style.height = this.option.height;
        canvasDom.style.background = this.option.background;
        this.dom.appendChild(canvasDom);

        this.canvasDom = canvasDom;
        this.canvas    = this.canvasDom.getContext("2d");
    }

    // 初始化绘制参数。
    function initRender() {
        // 计算分割线位置。
        var drawParam = {};

        drawParam.splitPosition = this.option.width * this.option.splitPosition;
        drawParam.atomSpace     = this.option.atomSpace || 1;
        drawParam.atomWidth     = (drawParam.splitPosition - (drawParam.atomSpace * (this.option.atomColCount + 1))) / this.option.atomColCount;
        drawParam.atomHeight    = (this.option.height - (drawParam.atomSpace * (this.option.atomRowCount + 1))) / this.option.atomRowCount;
        drawParam.fontItalic    = "italic normal " + this.option.fontSize + "px arial";
        drawParam.fontBold      = "normal bold " + this.option.fontSize + "px arial";


        this.drawParam = drawParam;
    }

    // 绘制方法。
    function render () {
        var _this = this;
        var ctx = _this.canvas;
        (function loop () {
            onRender.call(_this, ctx);
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(loop);
            } else if (window.webkitRequestAnimationFrame) {
                window.webkitRequestAnimationFrame(loop);
            } else {
                setTimeout(loop, 33);
            }
        })();
    }

    // 绘制实现方法。
    function onRender(ctx) {
        ctx.clearRect(0, 0,  this.option.width, this.option.height);

        // 绘制背景
        var ofs = ctx.fillStyle;
        ctx.fillStyle = this.option.background;
        ctx.fillRect(0,0, this.option.width, this.option.height);
        ctx.fillStyle = ofs;

        // 绘制游戏区 - 左边
        renderAtoms.call(this, ctx);

        // 绘制竖线。
        var oss = ctx.strokeStyle;
        var osw = ctx.lineWidth;
        ctx.strokeStyle = this.option.color1;
        ctx.lineWidth   = this.option.splitSize;
        ctx.moveTo(this.drawParam.splitPosition, 0);
        ctx.lineTo(this.drawParam.splitPosition, this.option.height);
        ctx.stroke();
        ctx.strokeStyle = oss;
        ctx.lineWidth   = osw;

        // 绘制游戏状态区 - 右边。
        renderBoard.call(this, ctx);
    }

    // 绘制点阵区域
    function renderAtoms (ctx) {
        var _this = this;
        var offsetRow = 0;
        var offsetCol = 0;

        var ofs = ctx.fillStyle;
        var oss = ctx.strokeStyle;
        var olw = ctx.lineWidth;
        WzwScreen.each(_this.atoms, function (row, rowIndex, atoms) {
            offsetRow += _this.drawParam.atomSpace;
            offsetCol = 0;
            WzwScreen.each(row, function (col, colIdex, row) {
                offsetCol += _this.drawParam.atomSpace;
                renderAtom.call(_this, ctx, col, offsetRow, offsetCol);

                // 如果有动画数组被赋值，说明希望进行动画，这里进行绘制。
                if (_this.animArr) {
                    var val = _this.animArr[rowIndex][colIdex];
                    // 仅在显示数组值不同于动画数组值，且动画数组值为1 时绘制这个位置。
                    if (val !== col && val === 1) {
                        renderAtom.call(_this, ctx, val, offsetRow, offsetCol);
                    }
                }

                offsetCol += _this.drawParam.atomWidth;
            });
            offsetRow += _this.drawParam.atomHeight;
        });

        ctx.fillStyle   = ofs;
        ctx.strokeStyle = oss;
        ctx.lineWidth   = olw;
    }

    // 绘制某一个点阵，需要 像素级别的两个offset值。
    function renderAtom(ctx, val, offsetRow, offsetCol) {
        var _this = this;
        ctx.strokeStyle = ctx.fillStyle = val > 0 ? _this.option.color1 : _this.option.color2;
        ctx.lineWidth = _this.option.atomBorder;

        ctx.strokeRect(offsetCol, offsetRow, _this.drawParam.atomWidth, _this.drawParam.atomHeight);
        ctx.fillRect(
            offsetCol + _this.option.atomInset,
            offsetRow + _this.option.atomInset,
            _this.drawParam.atomWidth  - (_this.option.atomInset * 2),
            _this.drawParam.atomHeight - (_this.option.atomInset * 2)
        )
    }

    // 绘制游戏状态区域
    function renderBoard (ctx) {
        var _this       = this;
        var ofs         = ctx.fillStyle;
        var olw         = ctx.lineWidth;
        var oss         = ctx.strokeStyle;
        var of          = ctx.font;
        var fontOffsetY = _this.option.fontHeight;
        var fontOffsetX = _this.drawParam.splitPosition + 5;

        ctx.strokeStyle = _this.option.color1;

        ctx.font = _this.drawParam.fontItalic;
        ctx.fillText("Score", fontOffsetX, fontOffsetY);
        ctx.font = _this.drawParam.fontBold;
        ctx.fillText(_this.score, fontOffsetX, fontOffsetY += this.option.fontHeight);

        ctx.font = _this.drawParam.fontItalic;
        ctx.fillText("Level", fontOffsetX, fontOffsetY += this.option.fontHeight);
        ctx.font = _this.drawParam.fontBold;
        ctx.fillText(_this.level, fontOffsetX, fontOffsetY += this.option.fontHeight);

        // 绘制预备点阵
        var offsetRow = fontOffsetY + 5;
        var offsetCol = fontOffsetX;
        WzwScreen.each(_this.statusAtoms, function (row) {
            offsetRow += _this.drawParam.atomSpace;
            offsetCol = fontOffsetX;
            WzwScreen.each(row, function (col) {
                offsetCol += _this.drawParam.atomSpace;
                renderAtom.call(_this, ctx, col, offsetRow, offsetCol);
                offsetCol += _this.drawParam.atomWidth;
            });
            offsetRow += _this.drawParam.atomHeight;
        });

        ctx.font        = of;
        ctx.strokeStyle = oss;
        ctx.fillStyle   = ofs;
        ctx.lineWidth   = olw;
    }

    /**
     * 对象合并方法。
     */
    WzwScreen.assign = function () {
        var arg1 = arguments[0];
        if (!arg1) {return;}
        for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
                for (var f in arg) {
                    arg1[f] = arg[f];
                }
            }
        }
        return arg1;
    }

    /**
     * 循环方法
     */
    WzwScreen.each = function (arr, cb/*(val, index, arr) => {} */) {
        if (!arr) return;
        if (Array.isArray(arr)) {
            for (var i = 0; i < arr.length; i++) {
                cb && cb(arr[i], i, arr);
            }
        } else if (Number.isInteger(arr)) {
            for (var i = 1; i <= arr; i++) {
                cb && cb(i, i-1, arr);
            }
        }
    }

    /**
     * 滚动方法， 将一个数字的值滚动到另一个数值。
     */
    WzwScreen.scroll = function (from, to, back, dur) {
        var y = from;
        y = y || 0;
        var startY = y;

        var distanceY = to - startY;

        if (distanceY === 0) {
            // 没有意义的滚动
            back && back.end && back.end(to);
            return undefined
        }

        var ended = false;
        var time = dur || 500;
        var ftp = 60;

        var ease = function (pos) { // 要使用的缓动公式
            return pos;
        };

        var startTime = Date.now(); // 开始时间
        // 开始执行
        (function dd () {
            setTimeout(function () {
                var now = Date.now(); // 当前帧开始时间
                var timestamp = now - startTime; // 逝去的时间(已进行动画的时间)
                var detal2 = ease(timestamp / time);
                var result2 = Math.ceil(startY + detal2 * distanceY);

                if (!ended) {
                    back && back.goo && back.goo(result2);
                }
                if (time <= timestamp) {
                    ended = true;
                    back.end(to);
                } else {
                    setTimeout(dd, 1000 / ftp);
                }
            }, 1000 / ftp);
        })();
    };

    /**
     * 动画集
     * */
    WzwScreen.ANIM = {
        CIRCLE: function () {


            // 求一个算法：
            // 将一个二维数组里面的元素按规则转换成一维数组。
            // 示例规则如下：
            //
            // 这是一个二维数组的内容
            // q a z w s x
            // e d c r f v
            // t g b y h n
            // y h n u j m
            // i k o l p q
            //
            // 转换为这样的一维数组:
            // q e t y i k o l p q m n v x s w z a d g h n u j h f r c b y

            // var arr = [
            //     ['q', 'a', 'z', 'w', 's', 'x'],
            //     ['e', 'd', 'c', 'r', 'f', 'v'],
            //     ['t', 'g', 'b', 'y', 'h', 'n'],
            //     ['y', 'h', 'n', 'u', 'j', 'm'],
            //     ['i', 'k', 'o', 'l', 'p', 'q']
            // ];

            var _this = this;
            var result = [];

            /**
             * 取数模式，l：左边，r：右边，t：上边，b：下边
             * @type {string}
             */
            var getMod = "l"; // 首先从左边开始取数。
            var totalCount = _this.option.atomRowCount * _this.option.atomColCount;
            var arr = [];
            WzwScreen.each(_this.option.atomRowCount, function (num, rowIndex) {
                arr[rowIndex] = [];
                WzwScreen.each(_this.option.atomColCount, function (num2, colIndex) {
                    arr[rowIndex][colIndex] = [rowIndex, colIndex];
                });
            });
            while (result.length < totalCount) {
                if (getMod === "l") {
                    for (var i = 0; i < arr.length; i++) {
                        result.push(arr[i].shift());
                    }

                    // 左边取完，设置为取下边。
                    getMod = "b";
                } else if (getMod === "b") {
                    var pop = arr.pop();
                    for (var i = 0; i < pop.length; i++) {
                        result.push(pop[i]);
                    }

                    // 下边取完，设置为取右边
                    getMod = "r";
                } else if (getMod === "r") {

                    // 右边的得从下往上。
                    for (var i = arr.length - 1; i >= 0; i--) {
                        result.push(arr[i].pop());
                    }

                    // 右边取完，取顶部的。
                    getMod = "t";
                } else if (getMod === "t") {

                    // 顶部的得从右往左
                    var shift = arr.shift();
                    for (var i = shift.length - 1; i >= 0 ; i--) {
                        result.push(shift[i]);
                    }

                    // 顶部取完，又取左边的。
                    getMod = "l";
                }
            }

            return {
                animArr: result,
                animType: ANIM_TYPE.ATOM_ATOM
            };
        }
    }

    window.WzwScreen = WzwScreen;
})(window);
