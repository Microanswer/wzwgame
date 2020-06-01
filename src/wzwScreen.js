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
     * 返回一个点阵二维数组，这个二维数组的大小和构建实例时相同。
     * @param valueAdapter [ Function ] 如果不指定，则返回的数组内容全是0，如果指定，
     * 必须是一个函数，传入rowIndex和colIndex，数组内容则是你返回的内容。
     */
    WzwScreen.prototype.makeNewArr = function (valueAdapter) {
        var _this = this;
        var arr = []
        WzwScreen.each(_this.option.atomRowCount, function (num, rowIndex) {
            arr[rowIndex] = [];
            WzwScreen.each(_this.option.atomColCount, function (num2, colIndex) {
                arr[rowIndex][colIndex] = valueAdapter ? valueAdapter(rowIndex, colIndex) : 0;
            });
        });
        return arr;
    }

    /**
     * 执行指定动画，这些动画需要时来自: WzwScreen.ANIM 里面的。
     * @param anim 某个动画
     * @param cb 当动画里的每一组动画执行到完成时的回调。
     */
    WzwScreen.prototype.playAnim = function (anim, cb) {
        if (!anim) {
            throw new Error("请指定要执行的动画。");
        }

        var _this = this;
        var animResult = anim.call(_this);

        // 生成动画数组
        _this.animArr = _this.makeNewArr();

        // 做一个简单的验证，必须时间配置和动画组个数相同。
        if (animResult.animArr.length !== animResult.animTime.length) {
            throw new Error("时间配置与动画不匹配。");
        }

        applyAnim.call(_this, animResult, 0, cb);
    }

    /**
     * 更新游戏点阵数组，传入一个二维数组，大小需要和配置的点阵大小相同。
     * 界面上可以对应显示。
     */
    WzwScreen.prototype.updateAtomArr = function (atomsArr) {
        this.atoms = atomsArr;
    }

    /**
     * 注册逻辑执行方法，被注册的方法会不停的被执行。
     * @param cb 回调函数。
     */
    WzwScreen.prototype.regLogic = function (cb) {
        this.logicFun = cb;
    }


    // 初始化数据 - 重置游戏时也可以调用此方法。
    function init() {
        var _this = this;

        /*
         初始化点阵数据。
         _this.atoms = _this.makeNewArr();
        */
        _this.atoms = undefined;

        // 初始化状态数据。
        _this.statusAtoms = [];
        WzwScreen.each(4, function (value, row) {
            _this.statusAtoms[row] = [];
            WzwScreen.each(4, function (value, col) {
                _this.statusAtoms[row][col] = Math.floor(Math.random()*2);
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

    // 逻辑执行方法，这个方法和render一样会不停的执行。
    function logicUpdate() {
        this.logicFun && this.logicFun();
    }

    // 绘制方法。
    function render () {
        var _this = this;
        var ctx = _this.canvas;
        (function loop () {
            logicUpdate.call(_this);
            onRender.call(_this, ctx);
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(loop);
            } else if (window.webkitRequestAnimationFrame) {
                window.webkitRequestAnimationFrame(loop);
            } else {
                setTimeout(loop, 16);
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
        WzwScreen.each(_this.option.atomRowCount, function (rowN, rowIndex) {
            offsetRow += _this.drawParam.atomSpace;
            offsetCol = 0;
            WzwScreen.each(_this.option.atomColCount, function (colN, colIdex) {
                offsetCol += _this.drawParam.atomSpace;

                var col = 0;
                if (_this.atoms) {
                    col = _this.atoms[rowIndex][colIdex];
                    renderAtom.call(_this, ctx, col, offsetRow, offsetCol);
                } else {
                    // 在没有初始化atoms的时候也要绘制灰色面板。
                    renderAtom.call(_this, ctx, col, offsetRow, offsetCol);
                }

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

    // 执行动画组,这是一个递归方法
    function applyAnim(animResult, animIndex, cb) {
        var _this = this;

        // 还有没有执行的动画组，则继续保持执行
        if (animIndex < animResult.animArr.length) {
            var animGroup = animResult.animArr[animIndex];
            var animTime  = animResult.animTime[animIndex];

            function applyFramOf(index) {
                // 拿到一帧。
                var fram = animGroup[index];
                if (!fram) {return;}

                _this.animArr = fram;
            }

            // 为动画数组动态加入数据，这样绘制的时候就会慢慢显示。
            WzwScreen.scroll(0, animGroup.length, {
                goo: applyFramOf,
                end: function (end) {
                    // 执行到end时再调一次，使界面会有一个从头到为完整的过程。
                    applyFramOf(end);

                    cb && cb(animResult.animName, animIndex);

                    // 本组动画完成，继续下一组。
                    applyAnim.call(_this, animResult, animIndex + 1, cb);
                }
            }, animTime);
        } else {
            // 所有动画都执行了，清空动画数组。
            _this.animArr = undefined;
        }

    }

    // 获取一个二维数组，这个二维数组里面的每个一维数组里的每个值其实也是一个数组（本质上整个二维数组是一个三维数组，我这样注释可能更容易理解），
    // 这个数组只有2个元素，第一个元素是当前值所在的rowIndex，第二个则是对应的colIndex。
    // 这么说起来，本方法返回的就是一个三维数组，每个一维数组保存了这个一维数组自身所在的位置信息。
    // 本方法的执行需要通过WzwGame实例。
    function getAtomPositionArr() {
        return this.makeNewArr(function (rowIndex, colIndex) {
            return [rowIndex, colIndex];
        });
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
     * 循环方法，这个方法用于循环二维数组。
     * @param arr
     * @param cb
     */
    WzwScreen.each2 = function (arr, cb/*(val, rowIndex, colIndex, arr)*/) {
        if (!arr) return;
        if (!cb) return;
        WzwScreen.each(arr.length, function (row, rowIndex) {
            WzwScreen.each(row, function (col, colIndex) {
                cb(col, rowIndex, colIndex, arr);
            });
        });
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
                var result2 = startY + Math.floor(detal2 * distanceY);

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
     * 二维数组融合方法， 将 src 指定的二维数组融入到 tar 这个二维数组里。 通过rowIndex 和 colIndex 可以指定融入到什么位置。
     * @param src 源二维数组
     * @param tar 目标二维数组
     * @param rowIndex 目标二维数组的行号
     * @param colIndex 目标二维数组的列好
     */
    WzwScreen.mergeArr = function(src, tar, rowIndex, colIndex) {
        rowIndex = rowIndex || 0;
        colIndex = colIndex || 0;

        WzwScreen.each(src, function (rowN, rowI) {
            WzwScreen.each(rowN, function (colN, colI) {
                if (rowI + rowIndex < tar.length && colI + colIndex < tar[rowI].length) {
                    tar[rowI +rowIndex][colI + colIndex] = colN;
                }
            });
        });
    }


    /**
     * 动画集。
     *
     * 这些动画都是一个方法，此方法应该返回一个（动画数组和动画时长）的对象。这个动画数组就像下面这样：
     *
     * 下面是一个动效的返回数据示例说明。
     * [
     *   // 这里表示执行一个动画,这个数组里的每一个数组表示一帧。
     *   [
     *     // 这里表示一帧动画要显示的点阵.
     *     [ [1,1,...,0,0], [1,1,0,....,0,0]... ],
     *
     *     // 如果说上一只会显示2个点阵，那么这一帧就会显示三个。
     *     [ [1,1,1,...,0,0], [1,1,1,...,0,0],[1,1,1,...,0,0]... ],
     *
     *     // 一直向下有很多很多个帧，这样就可以形成动画效果了。
     *     .
     *     .
     *     .
     *   ],
     *
     *   // 这里表示执行一个动画
     *   [
     *       [...],
     *       [...],
     *       .
     *       .
     *       .
     *   ]
     * ]
     * 这个数组里有2组动画，playanim方法将在每一组动画执行完成后执行一次回调，这样使得游戏实现端有机会在动画某个时刻执行某个动作。
     *
     * */
    WzwScreen.ANIM = {
        // 旋转动画
        CIRCLE: function () {
            // 旋转动画，需要具备旋转的效果。为了构建动画帧，需要先有下面所描述的算法实现。
            //
            // 二维数组的内容
            // q a z w s x
            // e d c r f v
            // t g b y h n
            // y h n u j m
            // i k o l p q
            //
            // 转换为这样的一维数组:
            // q e t y i k o l p q m n v x s w z a d g h n u j h f r c b y

            var _this = this;
            var result = [];

            // 下面实现上面的算法，通过得到这样的一维数组，更方便的构建旋转动画帧。
            var getMod     = "l"; // 取数模式，l：左边，r：右边，t：上边，b：下边。首先从左边开始取数。
            var totalCount = _this.option.atomRowCount * _this.option.atomColCount;
            var arr        = getAtomPositionArr.call(_this);
            while (result.length < totalCount) {
                var i;
                /**/ if (getMod === "l") {
                    for (i = 0; i < arr.length; i++) {
                        result.push(arr[i].shift());
                    }

                    // 左边取完，设置为取下边。
                    getMod = "b";
                }
                else if (getMod === "b") {
                    var pop = arr.pop();
                    for (i = 0; i < pop.length; i++) {
                        result.push(pop[i]);
                    }

                    // 下边取完，设置为取右边
                    getMod = "r";
                }
                else if (getMod === "r") {

                    // 右边的得从下往上。
                    for (i = arr.length - 1; i >= 0; i--) {
                        result.push(arr[i].pop());
                    }

                    // 右边取完，取顶部的。
                    getMod = "t";
                }
                else if (getMod === "t") {

                    // 顶部的得从右往左
                    var shift = arr.shift();
                    for (i = shift.length - 1; i >= 0 ; i--) {
                        result.push(shift[i]);
                    }

                    // 顶部取完，又取左边的。
                    getMod = "l";
                }
            }
            // 一维数组获取成功。

            // 开始根据这个一维数组构建动画帧
            var animGroup1 = [];
            WzwScreen.each(result, function (positionArr, index/*这里的index是从0开始的，所以下面的循环+1了*/) {
                var fram = _this.makeNewArr(); // 帧数组。
                WzwScreen.each(index + 1, function (val, jndex) {
                    var ps = result[jndex];
                    fram[ps[0]][ps[1]] = 1;
                });
                animGroup1.push(fram);
            });

            return {
                animName: "CIRCLE",
                animArr: [
                    animGroup1, // -----------------------
                    animGroup1.concat([]).reverse() //   |
                ],             //                        |--> 这就表示第一组动画的播放时长是1800毫秒。
                animTime: [    //                        |
                    2000, // -----------------------------
                    2000
                ]
            };
        },

        // 从底部到顶部遮盖动画
        B2T: function () {
            var _this = this;

            var animGroup = [];
            WzwScreen.each(_this.option.atomRowCount, function (row, rowIndex) {
                rowIndex = _this.option.atomRowCount - row;

                var frame = _this.makeNewArr();
                for (var i = rowIndex; i < _this.option.atomRowCount; i++) {
                    for (var j = 0; j < _this.option.atomColCount; j++) {
                        frame[i][j] = 1;
                    }
                }

                animGroup.push(frame);
            });

            return {
                animName: "B2T",
                animArr:  [animGroup, animGroup.concat([]).reverse()],
                animTime: [700,      700]
            }
        },

        // 从顶部到底部遮盖动画
        T2B: function () {
            var _this = this;

            var animGroup = [];
            WzwScreen.each(_this.option.atomRowCount, function (row, rowIndex) {
                var frame = _this.makeNewArr();
                for (var i = 0; i <= rowIndex; i++) {
                    for (var j = 0; j < _this.option.atomColCount; j++) {
                        frame[i][j] = 1;
                    }
                }

                animGroup.push(frame);
            });

            return {
                animName: "T2B",
                animArr:  [animGroup, animGroup.concat([]).reverse()],
                animTime: [700,      700]
            }
        },

        // 从顶部和底部同时进行遮盖，然后打开。
        COP: function () {
            var _this = this;

            var animGroup = [];

            var rowIndex = 0;
            var i = 0, j = 0;
            while(true) {
                var topRow = rowIndex;
                var bottomRow = _this.option.atomRowCount - (rowIndex + 1);

                var frame = _this.makeNewArr();
                for (i = 0; i <= topRow; i++) {
                    for (j = 0; j < _this.option.atomColCount; j++) {
                        frame[i][j] = 1;
                    }
                }

                for (i = _this.option.atomRowCount - 1; i >= bottomRow; i--) {
                    for (j = 0; j < _this.option.atomColCount; j++) {
                        frame[i][j] = 1;
                    }
                }
                animGroup.push(frame);

                if (topRow === bottomRow || Math.abs(topRow - bottomRow) === 1) {
                    break;
                }

                rowIndex++;
            }

            return {
                animName: "COP",
                animArr:  [animGroup, animGroup.concat([]).reverse()],
                animTime: [600,      600]
            }
        }
    };

    /**
     * A-Z 大写字母字符集
     * @type {{}}
     */
    WzwScreen.LETTER = {
        A: [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
        ],
        B: [
            [1,1,1,1,0],
            [0,1,0,0,1],
            [0,1,1,1,0],
            [0,1,0,0,1],
            [1,1,1,1,0],
        ],
        C: [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,0],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        D: [
            [1,1,1,1,0],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [0,1,0,0,1],
            [1,1,1,1,0],
        ],
        E: [
            [1,1,1,1,1],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,1,1,1,1],
        ],
        F: [
            [1,1,1,1,1],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
        ],
        G: [
            [0,1,1,1,0],
            [1,0,0,0,0],
            [1,0,1,1,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        H: [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
        ],
        I: [
            [0,1,1,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,1,1,1,0],
        ],
        J: [
            [0,1,1,1,0],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [1,0,0,1,0],
            [0,1,1,0,0],
        ],
        K: [
            [0,1,0,0,1],
            [0,1,0,1,0],
            [0,1,1,0,0],
            [0,1,0,1,0],
            [0,1,0,0,1],
        ],
        L: [
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,0],
        ],
        M: [
            [1,1,1,1,0],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
        ],
        N: [
            [1,0,0,0,1],
            [1,1,0,0,1],
            [1,0,1,0,1],
            [1,0,0,1,1],
            [1,0,0,0,1],
        ],
        O: [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        P: [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
        ],
        Q: [
            [0,1,1,0,0],
            [1,0,0,1,0],
            [1,0,0,1,0],
            [1,0,0,1,0],
            [0,1,1,1,1],
        ],
        R: [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,1,0,0],
            [1,0,0,1,1],
        ],
        S: [
            [0,1,1,1,1],
            [1,0,0,0,0],
            [0,1,1,1,0],
            [0,0,0,0,1],
            [1,1,1,1,0],
        ],
        T: [
            [1,1,1,1,1],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
        ],
        U: [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        V: [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
        ],
        W: [
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,1,1,1,0],
        ],
        X: [
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
            [0,1,0,1,0],
            [1,0,0,0,1],
        ],
        Y: [
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
        ],
        Z: [
            [1,1,1,1,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [1,1,1,1,1],
        ],
    };

    window.WzwScreen = WzwScreen;
})(window);
