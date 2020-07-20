let getWebpackCfgOf = require("./webpack_config");
let webpack = require("webpack");

console.log("开始 webpack 打包...")
webpack(getWebpackCfgOf("production"), function (stat) {
    console.log("webpack 打包结束。");
    console.log(stat);
});
