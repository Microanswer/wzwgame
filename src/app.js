var { WzwLauncher } = require("./platform/WzwLauncher");
var { Clicker }     = require("./platform/Clicker");
var { Snake, Tank, Tetris, Copyor} = require("./games/index");

/**
 * 建立一个启动器。
 * @type {WzwLauncher}
 */
var launch = new WzwLauncher("#screen", {
    testspan: document.querySelector("#testspan")
});

// 注册游戏
launch.regGame("A", new Tank());
launch.regGame("B", new Tetris());
launch.regGame("C", new Snake());
launch.regGame("D", new Copyor());

var clickers = {};

function onKeyUp(key)   {
    launch.onKeyUp(key);
    upKey(key);

    var clicker = clickers[key];
    if (clicker) {
        clicker.release();
    }
}
function onKeyDown(key) {
    var clicker = clickers[key];
    if (!clicker) {
        clicker = clickers[key] = new Clicker();
        clicker.onClick(function () {
            launch.onKeyDown(key);
            downKey(key);
        });
    }
    clicker.push();
}

function upKey(key) {
    var btn = document.querySelector("#" + key);
    btn.className = btn.className.replace(/ active/g, "");
}
function downKey(key) {
    var btn = document.querySelector("#" + key);
    if (btn.className.indexOf("active") < 0) {
        btn.className = btn.className + " active";
    }
}

var keyUpMap = {
    "w": function () {onKeyUp("up")    },
    "a": function () {onKeyUp("left")  },
    "s": function () {onKeyUp("down")  },
    "d": function () {onKeyUp("right") },
    " ": function () {onKeyUp("rotate")},
    "z": function () {onKeyUp("start") },
    "x": function () {onKeyUp("voice") },
    "c": function () {onKeyUp("onoff") },
    "v": function () {onKeyUp("reset") },
}

var keyDownMap = {
    "w": function () {onKeyDown("up")    },
    "a": function () {onKeyDown("left")  },
    "s": function () {onKeyDown("down")  },
    "d": function () {onKeyDown("right") },
    " ": function () {onKeyDown("rotate")},
    "z": function () {onKeyDown("start") },
    "x": function () {onKeyDown("voice") },
    "c": function () {onKeyDown("onoff") },
    "v": function () {onKeyDown("reset") },
}

// 监听键盘。
window.onkeyup   = function (event) {
    var f = keyUpMap[String(event.key).toLowerCase()];
    f && f();
    event.stopPropagation();
    if(event.preventDefault){
        event.preventDefault();
    }else{
        event.returnValue = false;
        window.event.returnValue = false;
    }
}
window.onkeydown = function (event) {
    var f = keyDownMap[String(event.key).toLowerCase()];
    f && f();
    event.stopPropagation();
    if(event.preventDefault){
        event.preventDefault();
    }else{
        event.returnValue = false;
        window.event.returnValue = false;
    }
}

// 监听界面按钮
var downevent = "mousedown";
var upevent   = "mouseup";
var u = navigator.userAgent;
if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {
    downevent = "touchstart"
    upevent = "touchend"
} else if (u.indexOf('iPhone') > -1) {
    downevent = "touchstart"
    upevent = "touchend"
}
var btns = document.querySelectorAll("button.btn[id]");
for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener(downevent,  function (e) {
        onKeyDown(this.id);
        e.stopPropagation();
        if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
            window.event.returnValue = false;
        }
    });
    btns[i].addEventListener(upevent,    function (e) {
        onKeyUp(this.id); e.stopPropagation();
        if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
            window.event.returnValue = false;
        }
    });
}


// 打开界面，500毫秒后开机。
setTimeout(function () {
    launch.reboot();
}, 500);
