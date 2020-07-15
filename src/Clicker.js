(function (window) {
    /**
     * 点击辅助器。可以帮你把长按实现为快速连点。
     *
     * 用法：
     *
     * var clicker = new Clicker();
     *
     * click.push();
     */

    function Clicker(option) {
        this.option = option || {
            timeout: 200,
            dely: 200
        };
        this.clicks = [];
        this.tasks = [];
    }

    Clicker.prototype.onClick = function (callback) {
        this.clicks.push(callback);
    };

    Clicker.prototype.push = function (event, timeout) {
        this.holding = true;
        timeout = timeout || this.option.timeout;

        makeClick.call(this, event);
        var _this = this;

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
            var handle = this.tasks.shift();
            clearTimeout(handle);
        }
    }

    function makeClick() {
        var c = this.clicks || [];
        for (var i = 0; i < (c).length; i++) {
            var cb = c[i];
            if (cb) {
                cb();
            }
        }
    }

    window.Clicker = Clicker;

})(window);
