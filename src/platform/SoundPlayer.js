/**
 * 声音播放器
 * @constructor
 */
function SoundPlayer() {

    /**
     *
     * @type {{[p: string]: HTMLAudioElement}}
     */
    this.soundList = {};
}

/**
 * 装载声音资源
 * @param id 声音id，在播放时使用id播放。
 * @param src 声音资源地址。
 */
SoundPlayer.prototype.loadSound = function (id, src) {
    let audio = new Audio(src);
    audio.controls = undefined;
    audio.autoplay = false;
    this.soundList[id] = audio;
};

/**
 * 播放指定声音
 * @param id
 * @param volume {number}
 * @param loop {boolean?}
 */
SoundPlayer.prototype.play = function (id, volume, loop) {
    let audio = this.soundList[id];
    audio.loop = !!loop;
    audio.volume = volume;
    audio.play();
};

module.exports = SoundPlayer;