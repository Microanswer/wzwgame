/**
 * 点击辅助器。可以帮你把长按实现为快速连点。
 *
 * 用法：
 *
 * let clicker = new Clicker();
 * clicker.onClick(function () {
 *     // 这里将会被连续执行。
 * })
 *
 * // 进入连续执行模式。
 * click.push();
 *
 * // 释放连续执行模式。
 * click.release();
 */

function Clicker(option) {
    this.option = option || {
        timeout: 240,    // 首次点击与后面连续执行的第一次执行的间隔时间。
        dely: 45         // 连续执行的间隔时间。
    };
    this.clicks = [];
    this.tasks = [];
}

Clicker.prototype.onClick = function (callback) {
    this.clicks.push(callback);
};

Clicker.prototype.push = function (event, timeout) {
    if (this.holding) {
        return;
    }

    this.holding = true;
    timeout = timeout || this.option.timeout;

    makeClick.call(this, event);
    let _this = this;

    function c() {
        if (_this.holding) {
            makeClick.call(_this, event);
            _this.tasks.push(setTimeout(c, _this.option.dely));
        }
    }
    _this.tasks.push(setTimeout(c, timeout));
};


Clicker.prototype.release = function () {
    this.holding = false;
    while (this.tasks.length > 0) {
        let handle = this.tasks.shift();
        clearTimeout(handle);
    }
}

function makeClick() {
    let c = this.clicks || [];
    for (let i = 0; i < (c).length; i++) {
        let cb = c[i];
        if (cb) {
            cb();
        }
    }
}

exports.Clicker = Clicker;
