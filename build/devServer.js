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

var server = new DevServer(webpack(cfg), devServerCfg);
server.listen(port,"127.0.0.1", err => {
    console.log('Started server on http://localhost:' + port);
});
