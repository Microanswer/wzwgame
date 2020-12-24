const {WzwScreen} = require("../platform/WzwScreen");

/**
 * 砖块类型
 */
const BLOCKER_TYPES_IIMG = [

    /**
     *
     * 口
     */
    [
        [0, 0],
        [1, 0]
    ],

    /**
     * 口
     * 口
     */
    [
        [1, 0],
        [1, 0]
    ],

    /**
     * 口
     * 口口
     */
    [
        [1, 0],
        [1, 1]
    ],

    /**
     * 口口
     * 口口
     */
    [
        [1, 1],
        [1, 1]
    ]

];

/**
 * 砖块类
 * @param blocktype {number}
 * @constructor
 */
function Block(blocktype, rowOffset, colOffset) {
    this.blocktype = blocktype;
    this.rowOffset = rowOffset;
    this.colOffset = colOffset;
}

/**
 *
 * @param atoms {number[][]}
 */
Block.prototype.renderInAtoms = function(atoms) {
    let arr = BLOCKER_TYPES_IIMG[this.blocktype];
    WzwScreen.mergeArr(arr, atoms, this.rowOffset, this.colOffset, function(tr, tc, sr, sc) {
        if (atoms[tr][tc] === 1) {
            return 1;
        } else if (arr[sr][sc]===1) {
            return 1;
        } else {
            return 0;
        }
    })
}

/**
 * 依次改变砖块类型
 */
Block.prototype.change = function() {
    if (this.blocktype + 1 >= BLOCKER_TYPES_IIMG.length) {
        this.blocktype = 0;
    } else  {
        this.blocktype += 1;
    }
}

/**
 * 砖块克隆游戏。
 * @constructor
 */
function Copyor() {

    this.initPreview();
}

/**
 * 【生命周期函数】当此游戏被注册到launch上时调用，并传入launch实例
 * @param launch {WzwLauncher}
 */
Copyor.prototype.onRegLaunch = function (launch) {
    this.screen = launch.screen;
};

// 【生命周期函数】预览，此方法应返回一个二维数组，一个row=10，col=11的二维数组。此方法会不停的被调用。
Copyor.prototype.getPreviewAtoms = function () {
    let arr;
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
Copyor.prototype.onLaunch = function () {
    this.blocks = [
        randomGetABlock(this.screen.option.atomRowCount - 2, 0),
        randomGetABlock(this.screen.option.atomRowCount - 2, 3),
        randomGetABlock(this.screen.option.atomRowCount - 2, 6),
    ];
};

// 【生命周期函数】游戏过程中，此方法会不停的被调用。应当返回一个二维数组，此二维数组就会渲染到界面。
Copyor.prototype.onUpdate = function () {
    if (typeof this.blocks === 'undefined') return ;
    
    let atoms = this.screen.makeNewArr();

    for (let i = 0; i < this.blocks.length; i++) {
        this.blocks[i].renderInAtoms(atoms);
    }

    return atoms;
};

// 【生命周期函数】游戏过程中，此方法会不同的被调用。返回一个二维数组，此二维数组会渲染到右侧的小点阵区域。
Copyor.prototype.onUpdateStatus = function () {

};

// 【生命周期函数】游戏结束时调用。比如:玩着玩着用户按一下复位按钮，此时动画执行到满屏，会调用该函数，游戏应该清除自己的状态。
Copyor.prototype.onDestroy = function (){

};

/**
 * 【事件函数】当某按键抬起时调用
 * @param key {"up"|"right" |"down"  |"left"  |"rotate"|"start" |"voice" |"onoff"|"reset }
 */
Copyor.prototype.onKeyup = function(key) {
    if (typeof this.blocks === 'undefined') return;

    if (key === 'left') {
        this.blocks[0].change();
    } else if (key === 'up') {
        this.blocks[1].change();
    } else if (key === 'right') {
        this.blocks[2].change();
    }
};

// 【事件函数】当某按键按下时调用
Copyor.prototype.onKeyDown = function () {

}

/**
 * 随机得到一个砖块
 * @param rowOffset {number}
 * @param colOffset {number}
 * @return {Block}
 */
function randomGetABlock (rowOffset, colOffset) {
    let blocktype = WzwScreen.random(0, BLOCKER_TYPES_IIMG.length);
    return new Block(blocktype, rowOffset, colOffset);
}

// 初始化预览图片。
Copyor.prototype.initPreview = function () {
    this.previewIndex = 0;
    this.previewTimeSpace = 200;
    this.previewArr = [
        [
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,1,1,0,0],
            [0,1,1,0,1,1,0,1,1,0,0],
        ], [
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,1,1,0,0],
            [0,1,1,0,1,1,0,1,1,0,0],
        ], [
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,1,1,0,0],
            [0,1,1,0,1,1,0,1,1,0,0],
        ], [
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,0,0,1,1,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
        ],[
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
        ],[
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
        ],[
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
        ],[
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,0,0,1,1,0,1,0,0,0],
            [0,1,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
        ],[
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
        ],[
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
        ],
    ];
}

exports.Copyor = Copyor;
