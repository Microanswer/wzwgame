let getWebpackCfgOf = require("./webpack_config");
let DevServer       = require("webpack-dev-server");
let webpack         = require("webpack");
let port            = 5686;

let cfg = getWebpackCfgOf("development");

Object.getOwnPropertyNames((cfg.entry || {})).map(function (name) {
    cfg.entry[name] = []
        .concat("webpack/hot/dev-server")
        .concat("webpack-dev-server/client?http://localhost:" + port)
        .concat(cfg.entry[name])
});

cfg.plugins = (cfg.plugins || []).concat(
    new webpack.optimize.OccurrenceOrderPlugin(),
    //添加HMR插件
    new webpack.HotModuleReplacementPlugin(),
);

let devServerCfg = {
    publicPath: "/",

    contentBase: false,
    index: "index.html",
    compress: true,
    port: port,
    hot: true,
    open: true,
    stats: {
        colors: true
    }
};

let server = new DevServer(webpack(cfg), devServerCfg);

// favicon.ico 图标的base64
let faviconBase64 = /*data:image/x-icon;base64,*/
    "AAABAAEAFBQAAAEAIAC4BgAAFgAAACgAAAAUAAAAKAAAAAEAIAAAAAAAkAYAAB" +
    "MLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAABCQDifNzcx3zc3Md83NzHfNzcx3zc3Md83NzHfODcy3zg3Mt8z" +
    "My/ZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADc3Md" +
    "/RyJb/0ciW/9HIlv/RyJb/0ciW/9HIlv/RyJb/0ciW/6Seef8eHiCAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANzcx39HIlv/RyJb/0ciW/0" +
    "tJPv8eHyH/eHRc/9HIlv/RyJb/pJ55/x4eIIAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAA3NzHf0ciW/9HIlv/RyJb/0ciW/9HIlv/RyJb/0c" +
    "iW/9HIlv+knnn/Hh4ggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAADc3Md/RyJb/s6yC/6Seef/RyJb/0ciW/7Osg/+zrIP/0ciW/6Seef8eHi" +
    "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANzcx37uzh/94" +
    "dFz/PDs1/6Seef/RyJb/ysGR/8S8jf/RyJb/pJ55/x4eIIAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3NzHf0ciW/5WQb/91cVr/0ciW/9HI" +
    "lv/RyJb/0ciW/9HIlv+knnn/Hh4ggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAADc3Md/RyJb/pJ55/6Seef+knnn/pJ55/6Weef+lnnn/pJ55" +
    "/6Seef8eHiCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANz" +
    "cx33l1X/+Eg4D/hIOA/4SDgP+Eg4D/hIOA/4SDgP8eHyH/pJ55/x4eIIAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3NzHfeXVf/6ioqf/t7e" +
    "3/7e3t/+3t7f/t7e3/7e3t/x4fIf+knnn/Hh4ggAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAADc3Md95dV//qKip/+3t7f/t7e3/7e3t/+3t7f" +
    "/t7e3/Hh8h/6Seef8eHiCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAANzcx33l1X/+Ghof/y8vL/+3t7f/t7e3/7e3t/+3t7f8eHyH/pJ55/x" +
    "4eIIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3NzHfeXVf" +
    "/6ioqf+Ghof/y8vL/+3t7f/t7e3/7e3t/x4fIf+knnn/Hh4ggAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADc3Md95dV//ubq6/7m6uv+Sk5T/" +
    "ubq6/7m6uv+5urr/Hh8h/6Seef8eHiCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAANzcx37WuiP95dWD/eXVg/3l1YP95dWD/eXVg/3l1YP95" +
    "dWD/pJ55/x4eIIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "BCQDifHh8h/x4fIf8eHyH/Hh8h/x4fIf8eHyH/Hh8h/x4fIf8qKijjAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///wZP//8FD4AfBy" +
    "+ADwbPgA8G/4APBl+ADwOvgA8G74APBz+ADwc/gA8DP4APBp+ADwd/gA8Hf4AP" +
    "Bo+ADwXPgA8DD4AfBk///wc///8EI=";

let faviconBuffer = Buffer.from(faviconBase64, "base64");

server.use("/favicon.ico", (req, res) => {
    res.header({"Content-Type": "image/x-icon"});
    res.end(faviconBuffer);
});
server.listen(port, err => {
    console.log('Started server on http://localhost:' + port);
});
