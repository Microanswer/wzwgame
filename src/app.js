let { WzwLauncher } = require("./platform/WzwLauncher");
let { Clicker }     = require("./platform/Clicker");
let Games           = require("./games/index");

/**
 * 建立一个启动器。
 * @type {WzwLauncher}
 */
let launch = new WzwLauncher("#screen", {
    testspan: document.querySelector("#testspan")
});

// 注册游戏
launch.regGame("A", new Games.Tank());
launch.regGame("B", new Games.Speed());
launch.regGame("C", new Games.Shooter());
launch.regGame("D", new Games.Tetris());
launch.regGame("E", new Games.Snake());
launch.regGame("F", new Games.Copyor());

let clickers = {};

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
    let btn = document.querySelector("#" + key);
    btn.className = btn.className.replace(/ active/g, "");
}
function downKey(key) {
    let btn = document.querySelector("#" + key);
    if (btn.className.indexOf("active") < 0) {
        btn.className = btn.className + " active";
    }
}

var keyUpMap = {
    /*w*/"87": function () {onKeyUp("up")    },
    /*↑*/"38": function () {onKeyUp("up")    },
    /*a*/"65": function () {onKeyUp("left")  },
    /*←*/"37": function () {onKeyUp("left")  },
    /*s*/"83": function () {onKeyUp("down")  },
    /*↓*/"40": function () {onKeyUp("down")  },
    /*d*/"68": function () {onKeyUp("right") },
    /*→*/"39": function () {onKeyUp("right") },
    /* */"32": function () {onKeyUp("rotate")},
    /*回车*/"13": function () {onKeyUp("rotate")},
    /*z*/"90": function () {onKeyUp("start") },
    /*x*/"88": function () {onKeyUp("voice") },
    /*c*/"67": function () {onKeyUp("onoff") },
    /*v*/"86": function () {onKeyUp("reset") },
};

let keyDownMap = {
     /*w*/"87": function () {onKeyDown("up")    },
     /*↑*/"38": function () {onKeyDown("up")    },
     /*a*/"65": function () {onKeyDown("left")  },
     /*←*/"37": function () {onKeyDown("left")  },
     /*s*/"83": function () {onKeyDown("down")  },
     /*↓*/"40": function () {onKeyDown("down")  },
     /*d*/"68": function () {onKeyDown("right") },
     /*→*/"39": function () {onKeyDown("right") },
     /* */"32": function () {onKeyDown("rotate")},
     /*回车*/"13": function () {onKeyDown("rotate")},
     /*z*/"90": function () {onKeyDown("start") },
     /*x*/"88": function () {onKeyDown("voice") },
     /*c*/"67": function () {onKeyDown("onoff") },
     /*v*/"86": function () {onKeyDown("reset") },
};

// 监听键盘。
window.onkeyup   = function (event) {
    var f = keyUpMap[String(event.keyCode).toLowerCase()];
    f && f();
    event.stopPropagation();
    if(event.preventDefault){
        event.preventDefault();
    }else{
        event.returnValue = false;
        window.event.returnValue = false;
    }
};
window.onkeydown = function (event) {
    var f = keyDownMap[String(event.keyCode).toLowerCase()];
    f && f();
    event.stopPropagation();
    if(event.preventDefault){
        event.preventDefault();
    }else{
        event.returnValue = false;
        window.event.returnValue = false;
    }
};

// 监听界面按钮
var downevent = "mousedown";
var upevent   = "mouseup";
var u = navigator.userAgent;
if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {
    downevent = "touchstart";
    upevent = "touchend"
} else if (u.indexOf('iPhone') > -1) {
    downevent = "touchstart";
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
