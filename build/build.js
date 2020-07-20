let getWebpackCfgOf = require("./webpack_config");
let webpack = require("webpack");

console.log("开始 webpack 打包...")
webpack(getWebpackCfgOf("production"), function (err, stat) {
    if (err) {
        console.log("webpack 打包出错：");
        console.error(err);
    } else {
        console.log("webpack 打包结束。");
        console.log(stat);
    }
});
