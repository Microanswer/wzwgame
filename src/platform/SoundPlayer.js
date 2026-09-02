/**
 * 声音播放器
 *
 * 基于 Web Audio API 实现。相比直接使用 HTMLAudioElement：
 *  - 音频文件会被预先解码为 AudioBuffer 常驻内存，播放延迟极低；
 *  - 每次播放创建一次性的 AudioBufferSourceNode，同一音效可以任意叠加/同时播放；
 *  - 通过 GainNode 独立控制每次播放的音量。
 *
 * 对于循环播放的音频（如背景音乐），会记录其 source 以便随后停止。
 *
 * @constructor
 */
function SoundPlayer() {
    /**
     * 已解码的音频缓冲区。
     * @type {{[id: string]: AudioBuffer}}
     */
    this.buffers = {};

    /**
     * 加载中的 Promise，避免同一资源重复请求，也可用于播放前等待。
     * @type {{[id: string]: Promise<AudioBuffer>}}
     */
    this.loading = {};

    /**
         * 正在循环播放的 source，按 id 记录，用于停止。
         * @type {{[id: string]: AudioBufferSourceNode}}
         */
    this.loopingSources = {};

    /**
     * 当前所有正在播放的 source（含一次性音效与循环音频），
     * 用于 stopAll 一次性停止全部声音。
     * @type {Set<AudioBufferSourceNode>}
     */
    this.activeSources = new Set();

    /**
     * 是否开启声音。默认关闭，需由外部显式开启后才会出声。
     * @type {boolean}
     */
    this.soundon = false;

    /**
     * @type {AudioContext|null}
     */
    this.ctx = null;

    let AudioCtx = (typeof window !== "undefined") &&
        (window.AudioContext || window.webkitAudioContext);
    if (AudioCtx) {
        this.ctx = new AudioCtx();
    }
}

/**
 * 恢复音频上下文。
 * 浏览器策略下 AudioContext 常常在用户交互前处于 suspended 状态，
 * 建议在首次用户手势（点击/按键）时调用一次。
 * @returns {Promise<void>}
 */
SoundPlayer.prototype.resume = function () {
    if (this.ctx && this.ctx.state === "suspended") {
        return this.ctx.resume();
    }
    return Promise.resolve();
};

/**
 * 装载声音资源。会异步请求并解码，解码结果缓存在内存中。
 * @param id 声音id，在播放时使用id播放。
 * @param src 声音资源地址。
 * @returns {Promise<AudioBuffer|null>}
 */
SoundPlayer.prototype.loadSound = function (id, src) {
    if (!this.ctx) {
        // 环境不支持 Web Audio，直接返回，play 时会走降级逻辑。
        return Promise.resolve(null);
    }

    if (this.buffers[id]) {
        return Promise.resolve(this.buffers[id]);
    }
    if (this.loading[id]) {
        return this.loading[id];
    }

    let self = this;
    let promise = fetch(src)
        .then(function (resp) {
            if (!resp.ok) {
                throw new Error("加载声音失败: " + src + " (" + resp.status + ")");
            }
            return resp.arrayBuffer();
        })
        .then(function (arrayBuffer) {
            // decodeAudioData 在部分老浏览器只支持回调形式，这里做个兼容包装。
            return new Promise(function (resolve, reject) {
                self.ctx.decodeAudioData(arrayBuffer, resolve, reject);
            });
        })
        .then(function (audioBuffer) {
            self.buffers[id] = audioBuffer;
            // console.log("SoundPlayer.loadSound: loaded", id, src);
            delete self.loading[id];
            return audioBuffer;
        })
        .catch(function (err) {
            delete self.loading[id];
            throw err;
        });

    this.loading[id] = promise;
    return promise;
};

SoundPlayer.prototype.setSoundOn = function (on) {
    this.soundon = !!on;
}

/**
 * 播放指定声音。
 * 每次调用都会创建新的一次性播放节点，因此同一音效可以叠加播放。
 * @param id
 * @param volume {number} 音量，范围 0 ~ 1。
 * @param loop {boolean?} 是否循环播放（如背景音乐）。
 */
SoundPlayer.prototype.play = function (id, volume, loop) {
    // console.log("SoundPlayer.play", id, volume, loop);
    if (!this.ctx) {
        return;
    }

    // 声音关闭时不播放。
    if (!this.soundon) {
        return;
    }

    // console.log("SoundPlayer.play2", id, volume, loop);
    let buffer = this.buffers[id];
    if (!buffer) {
        // 资源可能仍在加载：加载完成后按当前参数播放一次。
        let self = this;
        let pending = this.loading[id];
        if (pending) {
            pending.then(function () {
                self.play(id, volume, loop);
            }).catch(function () { /* 加载失败，静默忽略 */ });
        }
        return;
    }

    // 尽量确保上下文已激活。
    if (this.ctx.state === "suspended") {
        this.ctx.resume();
    }

    let source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = !!loop;

    let gain = this.ctx.createGain();
    gain.gain.value = (typeof volume === "number") ? volume : 1;

    source.connect(gain);
    gain.connect(this.ctx.destination);

    // 记录为活动 source，供 stopAll 统一停止。
    let self = this;
    this.activeSources.add(source);
    source.onended = function () {
        source.disconnect();
        gain.disconnect();
        self.activeSources.delete(source);
    };

    if (loop) {
        // 循环音频需要能被停止，先停掉可能已有的同 id 循环，避免叠加。
        this.stop(id);
        this.loopingSources[id] = source;
    }

    source.start(0);
};

/**
 * 停止指定的循环音频（如背景音乐）。
 * 对一次性音效无效（它们播完即自动结束）。
 * @param id
 */
SoundPlayer.prototype.stop = function (id) {
    let source = this.loopingSources[id];
    if (source) {
        try {
            source.stop();
        } catch (e) {
            // 已经停止的 source 再次 stop 会抛错，忽略即可。
        }
        source.disconnect();
        this.activeSources.delete(source);
        delete this.loopingSources[id];
    }
};

/**
 * 停止当前正在播放的所有声音（含一次性音效与循环音频）。
 * 适用于用户关闭音量时立即静音。
 */
SoundPlayer.prototype.stopAll = function () {
    this.activeSources.forEach(function (source) {
        try {
            source.stop();
        } catch (e) {
            // 已经停止的 source 再次 stop 会抛错，忽略即可。
        }
        source.disconnect();
    });
    this.activeSources.clear();
    this.loopingSources = {};
};

module.exports = SoundPlayer;