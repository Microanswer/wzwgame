const DEFAULT_OPTION = {
    width:         193,           // 游戏屏幕宽度
    height:        255,           // 游戏屏幕高度
    atomRowCount:  21,            // 点阵行数
    atomColCount:  11,            // 点阵列数
    atomBorder:    2,             // 点阵边框大小
    atomInset:     2,             // 点阵内空白大小
    atomSpace:     3,             // 点阵间距
    splitPosition: 0.7 ,         // 左右分隔位置，取值范围:0~1
    splitSize:     1,             // 分割线大小
    fontSize:      13,            // 文字大小
    fontHeight:    15,            // 文字行高
    background:    "#9facaa",     // 背景色
    color1:        "#000000",     // 浓颜色
    color2:        "#9aa5a3",     // 浅颜色
};

const CONSTANT = {
    STRINGS: {
        score: "Score",
        best:  "Best",
        level: "Level",
        pause: "PAUSE",
        fps:   "FPS"
    }
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

    /**
     *
     * @type {{
     *  width:          number
     *  height:              number
     *  atomRowCount:        number
     *  atomColCount:        number
     *  atomBorder:          number
     *  atomInset:           number
     *  atomSpace:           number
     *  splitPosition:       number
     *  splitSize:           number
     *  fontSize:            number
     *  fontHeight:          number
     *  background:    string
     *  color1:        string
     *  color2:        string
     * }}
     */
    this.option = WzwScreen.assign({}, DEFAULT_OPTION, option || {});

    this.testspan = this.option.testspan;

    init.call(this);             // 初始化数据。
    initScreen.call(this);       // 初始化绘画板。

    initRender.call(this);       // 初始化绘制参数，比如说：点阵大小、分割线位置。
    render.call(this);           // 开始绘制。
}

/**
 * 获取单个点的像素大小
 * @return {{width: number, height: number}}
 */
WzwScreen.prototype.getAtomSize = function () {
    return {width: this.drawParam.atomWidth, height: this.drawParam.atomHeight};
}

/**
 * 重置游戏
 */
WzwScreen.prototype.reset = function () {
    init.call(this);
};

/**
 * 返回一个点阵二维数组，这个二维数组的大小和构建实例时相同。
 * @param valueAdapter [ Function ] 如果不指定，则返回的数组内容全是0，如果指定，
 * 必须是一个函数，传入rowIndex和colIndex，数组内容则是你返回的内容。
 *
 * @return {number[][]}
 */
WzwScreen.prototype.makeNewArr = function (valueAdapter) {
    let _this = this;
    let arr = []
    WzwScreen.each(_this.option.atomRowCount, function (num, rowIndex) {
        arr[rowIndex] = [];
        WzwScreen.each(_this.option.atomColCount, function (num2, colIndex) {
            arr[rowIndex][colIndex] = valueAdapter ? valueAdapter(rowIndex, colIndex) : 0;
        });
    });
    return arr;
};

/**
 * 执行指定动画，这些动画需要时来自: WzwScreen.ANIM 里面的。
 * @param anim 某个动画
 * @param cb 当动画里的每一组动画执行到完成时的回调。回调传入 动画名字、动画序号， 如果序号为 -1 则表示动画被中断
 */
WzwScreen.prototype.playAnim = function (anim, cb) {
    if (!anim) {
        throw new Error("请指定要执行的动画。");
    }

    let _this = this;
    let animResult = anim.call(_this);


    // 做一个简单的验证，必须时间配置和动画组个数相同。
    if (animResult.animArr.length !== animResult.animTime.length) {
        throw new Error("时间配置与动画不匹配。");
    }

    // 生成动画数组
    _this.animArr = _this.makeNewArr();
    _this.animResult = animResult;
    applyAnim.call(_this, animResult, 0, cb);
};

/**
 * 更新游戏点阵数组，传入一个二维数组，大小需要和配置的点阵大小相同。
 * 界面上可以对应显示。
 */
WzwScreen.prototype.updateAtomArr = function (atomsArr) {
    this.atoms = undefined;
    this.atoms = atomsArr;
};

/**
 * 跟新游戏状态点阵。
 * @param atomsArr
 */
WzwScreen.prototype.updateStatusAtoms = function (atomsArr) {
    this.statusAtoms = undefined;
    this.statusAtoms = atomsArr;
}

/**
 * 注册逻辑执行方法，被注册的方法会不停的被执行。
 * @param cb 回调函数。
 */
WzwScreen.prototype.regLogic = function (cb) {
    this.logicFun = cb;
};

WzwScreen.prototype.setLevel = function (level) {
    this.level = level;
}

WzwScreen.prototype.setScore = function (score) {
    this.score = score;
}

WzwScreen.prototype.setPause = function (pause) {
    this.paused = pause;
}
WzwScreen.prototype.setBest = function (best) {
    this.best = best;
}


// 初始化数据 - 重置游戏时也可以调用此方法。
function init() {
    let _this = this;

    /*
     初始化点阵数据。
     _this.atoms = _this.makeNewArr();
    */
    _this.atoms = undefined;

    // 初始化状态数据。
    _this.statusAtoms = undefined;

    this.fps    = 60;
    this.score  = 0;
    this.paused = false;
    this.level  = 0;
    this.best   = 0;
}

// 初始化屏幕
function initScreen () {
    let canvasDom = document.createElement("canvas");
    canvasDom.width            = canvasDom.style.width  = this.option.width;
    canvasDom.height           = canvasDom.style.height = this.option.height;
    canvasDom.style.margin     = "0";
    canvasDom.style.padding    = "0";
    canvasDom.style.background = this.option.background;
    canvasDom.style.display    = "block";
    // this.dom.appendChild(canvasDom);
    this.canvasDom = canvasDom;

    // let innerCanvasDom = document.createElement("canvas");
    // innerCanvasDom.width            = innerCanvasDom.style.width  = this.option.width;
    // innerCanvasDom.height           = innerCanvasDom.style.height = this.option.height;
    // innerCanvasDom.style.background = this.option.background;
    // this.innerCanvasDom = innerCanvasDom;
    this.dom.appendChild(canvasDom);

    this.canvas     = this.canvasDom.getContext("2d");
    // this.viewCanvas = this.canvasDom.getContext("2d");
}

// 初始化绘制参数。
function initRender() {
    // 计算分割线位置。
    let drawParam = {};

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
    let _this = this;
    let _fps = 0;
    let m = "";
    setInterval(function fpsUpdate() {
        _this.fps = _fps;
        _fps = 0;
    }, 1000);

    (function loop () {
        let t = Date.now();
        _fps += 1;
        logicUpdate.call(_this);
        let t2 = Date.now();
        onRender.call(_this, _this.canvas);
        let t3 = Date.now();
        // applyRender.call(_this, _this.canvas);

        if (window.requestAnimationFrame) {
            m = "requestAnimationFrame";
            window.requestAnimationFrame(loop);
        } else if (window.webkitRequestAnimationFrame) {
            m = "webkitRequestAnimationFrame";
            window.webkitRequestAnimationFrame(loop);
        } else {
            m = "setTimeout";
            setTimeout(loop, 16);
        }
        let t4 = Date.now();

        // 如果设置了testspan，则将一些绘制信息显示在这里面。
        if (_this.testspan) {_this.testspan.innerText = ("逻辑耗时：" + (t2 - t) + "ms, 绘制耗时：" + (t3 - t2) + "ms, 帧请求(" +m+ ")耗时：" + (t4 - t3) + "ms, 帧间隔:"+(t -_this.lastttime) + "ms");}
        _this.lastttime = Date.now();
    })();
}

// 绘制实现方法。
function onRender(ctx) {
    ctx.clearRect(0, 0,  this.option.width, this.option.height);
    ctx.save();
    ctx.beginPath();

    // 绘制背景
    let ofs = ctx.fillStyle;
    ctx.fillStyle = this.option.background;
    ctx.fillRect(0,0, this.option.width, this.option.height);
    ctx.fillStyle = ofs;

    // 绘制游戏区 - 左边
    renderAtoms.call(this, ctx);

    // 绘制竖线。
    let oss = ctx.strokeStyle;
    let osw = ctx.lineWidth;
    ctx.strokeStyle = this.option.color1;
    ctx.lineWidth   = this.option.splitSize;
    ctx.moveTo(this.drawParam.splitPosition, 0);
    ctx.lineTo(this.drawParam.splitPosition, this.option.height);
    ctx.stroke();
    ctx.strokeStyle = oss;
    ctx.lineWidth   = osw;

    // 绘制游戏状态区 - 右边。
    renderBoard.call(this, ctx);

    ctx.closePath();
    ctx.restore();
}

// 绘制点阵区域
function renderAtoms (ctx) {
    let _this = this;
    let offsetRow = 0;
    let offsetCol = 0;

    let ofs = ctx.fillStyle;
    let oss = ctx.strokeStyle;
    let olw = ctx.lineWidth;
    WzwScreen.each(_this.option.atomRowCount, function (rowN, rowIndex) {
        offsetRow += _this.drawParam.atomSpace;
        offsetCol = 0;
        WzwScreen.each(_this.option.atomColCount, function (colN, colIdex) {
            offsetCol += _this.drawParam.atomSpace;

            let col = 0;
            if (_this.atoms) {
                col = _this.atoms[rowIndex][colIdex];
                renderAtom.call(_this, ctx, col, offsetRow, offsetCol);
            } else {
                // 在没有初始化atoms的时候也要绘制灰色面板。
                renderAtom.call(_this, ctx, col, offsetRow, offsetCol);
            }

            // 如果有动画数组被赋值，说明希望进行动画，这里进行绘制。
            if (_this.animArr) {
                let val = _this.animArr[rowIndex][colIdex];
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
    ctx.strokeStyle = ctx.fillStyle = val > 0 ? this.option.color1 : this.option.color2;
    ctx.lineWidth = this.option.atomBorder;

    ctx.strokeRect(offsetCol, offsetRow, this.drawParam.atomWidth, this.drawParam.atomHeight);
    ctx.fillRect(
        offsetCol + this.option.atomInset,
        offsetRow + this.option.atomInset,
        this.drawParam.atomWidth  - (this.option.atomInset * 2),
        this.drawParam.atomHeight - (this.option.atomInset * 2)
    )
}

// 绘制游戏状态区域
function renderBoard (ctx) {
    let _this       = this;
    let ofs         = ctx.fillStyle;
    let olw         = ctx.lineWidth;
    let oss         = ctx.strokeStyle;
    let of          = ctx.font;
    let fontOffsetY = _this.option.fontHeight;
    let fontOffsetX = _this.drawParam.splitPosition + 5;

    ctx.strokeStyle = _this.option.color1;
    ctx.fillStyle   = _this.option.color1;

    ctx.font = _this.drawParam.fontItalic;
    ctx.fillText(CONSTANT.STRINGS.score, fontOffsetX, fontOffsetY);
    ctx.font = _this.drawParam.fontBold;
    ctx.fillText(_this.score, fontOffsetX, fontOffsetY += _this.option.fontHeight);

    ctx.font = _this.drawParam.fontItalic;
    ctx.fillText(CONSTANT.STRINGS.level, fontOffsetX, fontOffsetY += _this.option.fontHeight);
    ctx.font = _this.drawParam.fontBold;
    ctx.fillText(_this.level, fontOffsetX, fontOffsetY += _this.option.fontHeight);

    // 绘制预备点阵
    let offsetRow = fontOffsetY + 5;
    let offsetCol = fontOffsetX;
    WzwScreen.each(4, function (rowVal, row) {
        offsetRow += _this.drawParam.atomSpace;
        offsetCol = fontOffsetX;
        WzwScreen.each(4, function (colVal, col) {
            offsetCol += _this.drawParam.atomSpace;
            renderAtom.call(_this, ctx, _this.statusAtoms?_this.statusAtoms[row][col]:0, offsetRow, offsetCol);
            offsetCol += _this.drawParam.atomWidth;
        });
        offsetRow += _this.drawParam.atomHeight;
    });
    fontOffsetY = offsetRow + 5;

    ctx.strokeStyle = ctx.fillStyle = _this.option.color1;

    // 绘制最佳成绩
    ctx.font = _this.drawParam.fontItalic;
    ctx.fillText(CONSTANT.STRINGS.best, fontOffsetX, fontOffsetY += _this.option.fontHeight);
    ctx.font = _this.drawParam.fontBold;
    ctx.fillText(_this.best, fontOffsetX, fontOffsetY += _this.option.fontHeight);


    fontOffsetY += 5;
    // 绘制暂停标识。
    ctx.fillStyle = _this.paused ? _this.option.color1 : _this.option.color2;
    ctx.font = _this.drawParam.fontItalic;
    ctx.fillText(CONSTANT.STRINGS.pause, fontOffsetX, fontOffsetY += _this.option.fontHeight);


    // 绘制fps
    ctx.strokeStyle = ctx.fillStyle = _this.option.color1;
    ctx.font = _this.drawParam.fontItalic;
    ctx.fillText(CONSTANT.STRINGS.fps, fontOffsetX, _this.option.height - _this.option.fontHeight - 2);
    ctx.font = _this.drawParam.fontBold;
    ctx.fillText(_this.fps, fontOffsetX, _this.option.height - 2);

    ctx.font        = of;
    ctx.strokeStyle = oss;
    ctx.fillStyle   = ofs;
    ctx.lineWidth   = olw;
}

// function applyRender(ctx) {
//     this.viewCanvas.clearRect(0, 0,  this.option.width, this.option.height);
//     this.viewCanvas.drawImage(this.innerCanvasDom, 0, 0);
// }

// 执行动画组,这是一个递归方法
function applyAnim(animResult, animIndex, cb) {
    let _this = this;

    // 还有没有执行的动画组，则继续保持执行
    if (animIndex < animResult.animArr.length) {
        let animGroup = animResult.animArr[animIndex];
        let animTime  = animResult.animTime[animIndex];

        function applyFramOf(index) {
            // 拿到一帧。
            let fram = animGroup[index];
            if (!fram) {return;}

            // 在执行这个动画时发现动画本体被替换成了别的，那一定时这个动画还没完成，就在执行另一个动画了。
            // 这里直接将这个动画终止。
            if (_this.animResult !== animResult) {
                return "kill";
            }

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
            },
            // 被终止时执行。
            kill: function () {
                cb && cb(animResult.animName, -1);
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
 * 屏幕大小计算器。
 * 通过传入点阵边框粗细，内边距大小，点阵间隔大小，分割线占比，将给出一个最合适的屏幕区域像素大小值。
 * @constructor
 */
WzwScreen.ScreenSizeCalculator = function (atomSpace, atomBorder, atomInset, atomInner, atomColCount,atomRowCount,splitPosition) {
    let atomSize = ((atomBorder*2) + (atomInset*2) + atomInner);
    let height = ((atomSize + atomSpace) * atomRowCount) + atomSpace;
    let width = (((atomSize + atomSpace) * atomColCount) + atomSpace) / splitPosition;
    return {width: Math.round(width), height: height};
};

/**
 * 对象合并方法。
 */
WzwScreen.assign = function () {
    let arg1 = arguments[0];
    if (!arg1) {return;}
    for (let i = 1; i < arguments.length; i++) {
        let arg = arguments[i];
        if (arg) {
            for (let f in arg) {
                arg1[f] = arg[f];
            }
        }
    }
    return arg1;
};

/**
 * 循环方法
 */
WzwScreen.each = function (arr, cb/*(val, index, arr) => {} */) {
    if (!arr) return;
    if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
            cb && cb(arr[i], i, arr);
        }
    } else if (Number.isInteger(arr)) {
        for (let i = 1; i <= arr; i++) {
            cb && cb(i, i-1, arr);
        }
    }
};

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
};

/**
 * 滚动方法， 将一个数字的值滚动到另一个数值。
 */
WzwScreen.scroll = function (from, to, back, dur) {
    let y = from;
    y = y || 0;
    let startY = y;

    let distanceY = to - startY;

    if (distanceY === 0) {
        // 没有意义的滚动
        back && back.end && back.end(to);
        return undefined
    }

    let ended = false;
    let time = dur || 500;
    let ftp = 60;

    let ease = function (pos) { // 要使用的缓动公式
        return pos;
    };

    let startTime = Date.now(); // 开始时间
    // 开始执行
    (function dd () {
        setTimeout(function () {
            let now = Date.now(); // 当前帧开始时间
            let timestamp = now - startTime; // 逝去的时间(已进行动画的时间)
            let detal2 = ease(timestamp / time);
            let result2 = startY + Math.floor(detal2 * distanceY);

            if (!ended) {
                let result = back && back.goo && back.goo(result2);
                if ("kill" === result) {
                    // 中段滚动。
                    back.kill && back.kill();
                    return;
                }
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
 * @param src {number[][]} 源二维数组
 * @param tar {number[][]} 目标二维数组
 * @param rowIndex {number} 目标二维数组的行号
 * @param colIndex {number} 目标二维数组的列好
 * @param valueAdapter {?function(tarRowIndex, tarColIndex, srcRowIndex, srcColIndex)} 自定义融合规则， 不传递则是 直接将src里覆盖对应tar里的内容。
 */
WzwScreen.mergeArr = function(src, tar, rowIndex, colIndex, valueAdapter) {
    rowIndex = rowIndex || 0;
    colIndex = colIndex || 0;

    WzwScreen.each(src, function (rowN, rowI) {
        WzwScreen.each(rowN, function (colN, colI) {
            if (rowI + rowIndex < tar.length && colI + colIndex < tar[rowI].length) {
                let tarRowIndex = rowI + rowIndex;
                let tarColIndex = colI + colIndex;
                if (tarColIndex < 0 || tarRowIndex < 0) {
                    return;
                }

                if (valueAdapter) {
                    tar[tarRowIndex][tarColIndex] = valueAdapter(tarRowIndex, tarColIndex, rowI, colI);
                } else {
                    tar[tarRowIndex][tarColIndex] = colN;
                }
            }
        });
    });
};

/**
 * 二维数组融合方法，和 mergeArr 不一样的是， 此方法将结果返回，而不修改 tar.
 * @param src
 * @param tar
 * @param rowIndex
 * @param colIndex
 * @param valueAdapter
 */
WzwScreen.mergeArr2 = function(src, tar, rowIndex, colIndex, valueAdapter) {
    rowIndex = rowIndex || 0;
    colIndex = colIndex || 0;
    let newArr = [];

    WzwScreen.each(tar, function (row, mRowIndex) {
        newArr[mRowIndex] = [];
        WzwScreen.each(row, function (col, mColIndex) {
            newArr[mRowIndex][mColIndex] = col;
            if (
                mRowIndex >= rowIndex && mColIndex >= colIndex &&
                mRowIndex < rowIndex + src.length && mColIndex < colIndex + src[0].length
            ) {
                if (!valueAdapter) {
                    newArr[mRowIndex][mColIndex] = src[mRowIndex - rowIndex][mColIndex - colIndex];
                } else {
                    newArr[mRowIndex][mColIndex] = valueAdapter(
                        mRowIndex, mColIndex,
                        mRowIndex - rowIndex, mColIndex - colIndex
                    );
                }
            }
        });
    });

    return newArr;
};

/**
 * 产生一个 [start, end) 之间的随机数
 * @param start
 * @param end
 */
WzwScreen.random = function(start, end) {
    return Math.floor((Math.random() * (end - start)) + start);
};

/**
 * 数组拷贝, 随便多少纬。
 * @param src {any...[]}
 * */
WzwScreen.arrCopy = function arrCopy(src) {
    const temp = [];
    for (let i = 0; i < src.length; i++) {
        if (Array.isArray(src[i])) {
            temp[i] = WzwScreen.arrCopy(src[i]);
        } else {
            temp[i] = src[i];
        }
    }
    return temp;
};

let storage = {
    getItem: function (key) {console.warn("getItem不支持localstorage、sessionstorage")},
    setItem: function (key,value) {console.warn("setItem不支持localstorage、sessionstorage")},
    removeItem: function (key) {console.warn("removeItem不支持localstorage、sessionstorage")},
};

WzwScreen.storeGet = function (key) {
    let v = (localStorage || sessionStorage || storage).getItem(key);
    if (v) {
        return JSON.parse(v);
    }
    return v;
};
WzwScreen.storeSet = function(key, value) {
    return (localStorage || sessionStorage || storage).setItem(key, JSON.stringify(value));
};
WzwScreen.storeRemove = function (key) {
    return (localStorage || sessionStorage || storage).removeItem(key);
};


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

        let _this = this;
        let result = [];

        // 下面实现上面的算法，通过得到这样的一维数组，更方便的构建旋转动画帧。
        let getMod     = "l"; // 取数模式，l：左边，r：右边，t：上边，b：下边。首先从左边开始取数。
        let totalCount = _this.option.atomRowCount * _this.option.atomColCount;
        let arr        = getAtomPositionArr.call(_this);
        while (result.length < totalCount) {
            let i;
            /**/ if (getMod === "l") {
                for (i = 0; i < arr.length; i++) {
                    result.push(arr[i].shift());
                }

                // 左边取完，设置为取下边。
                getMod = "b";
            }
            else if (getMod === "b") {
                let pop = arr.pop();
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
                let shift = arr.shift();
                for (i = shift.length - 1; i >= 0 ; i--) {
                    result.push(shift[i]);
                }

                // 顶部取完，又取左边的。
                getMod = "l";
            }
        }
        // 一维数组获取成功。

        // 开始根据这个一维数组构建动画帧
        let animGroup1 = [];
        WzwScreen.each(result, function (positionArr, index/*这里的index是从0开始的，所以下面的循环+1了*/) {
            let fram = _this.makeNewArr(); // 帧数组。
            WzwScreen.each(index + 1, function (val, jndex) {
                let ps = result[jndex];
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
        let _this = this;

        let animGroup = [];
        WzwScreen.each(_this.option.atomRowCount, function (row, rowIndex) {
            rowIndex = _this.option.atomRowCount - row;

            let frame = _this.makeNewArr();
            for (let i = rowIndex; i < _this.option.atomRowCount; i++) {
                for (let j = 0; j < _this.option.atomColCount; j++) {
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
        let _this = this;

        let animGroup = [];
        WzwScreen.each(_this.option.atomRowCount, function (row, rowIndex) {
            let frame = _this.makeNewArr();
            for (let i = 0; i <= rowIndex; i++) {
                for (let j = 0; j < _this.option.atomColCount; j++) {
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
        let _this = this;

        let animGroup = [];

        let rowIndex = 0;
        let i = 0, j = 0;
        while(true) {
            let topRow = rowIndex;
            let bottomRow = _this.option.atomRowCount - (rowIndex + 1);

            let frame = _this.makeNewArr();
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


/**
 *  爆炸类。
 * @param param {{offsetRow:number,offsetCol: number,keepTime?:number,onEnd?:function()}}
 * @constructor
 */
function WzwBomb(param) {
    param = param || {};

    this.height = 4;
    this.width  = 4;
    this.time   = 50;
    this.offsetRow = param.offsetRow;
    this.offsetCol = param.offsetCol;
    this.frams  =
        [
            [[1,0,0,1],
             [0,1,1,0],
             [0,1,1,0],
             [1,0,0,1]],

            [[0,1,1,0],
             [1,0,0,1],
             [1,0,0,1],
             [0,1,1,0]]
        ];
    this.currentFram = 0;
    this.keepTime = param.keepTime || 1000; // 爆炸持续时间 （毫秒）

    let _this = this;
    setTimeout(function () {
        if (param.onEnd) {
            param.onEnd.call(_this);
        }
    }, this.keepTime);
}

WzwBomb.prototype.update = function () {
    if (Date.now() - (this.lastTime || 0) >= this.time) {
        this.currentFram = this.currentFram === 0 ? 1 : 0;
        this.lastTime = Date.now();
    }
};

WzwBomb.prototype.getCurrentFrame = function () {
    return this.frams[this.currentFram];
};

/**
 * 渲染
 * @param atoms {number[][]}
 */
WzwBomb.prototype.render = function (atoms) {
    WzwScreen.mergeArr(this.getCurrentFrame(), atoms, this.offsetRow, this.offsetCol, undefined);
};

exports.DEFAULT_OPTION = DEFAULT_OPTION;
exports.WzwBomb   = WzwBomb;
exports.WzwScreen = WzwScreen;
