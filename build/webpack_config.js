const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack           = require("webpack");
const path              = require("path");
const ProjectRoot       = path.resolve(__dirname, "../");
const packageJson       = require("../package.json");

function pathOf(dir) {
    return path.resolve(ProjectRoot, dir);
}

/**
 * 返回指定环境的webpack配置。
 * @param env 可选值"production","development"
 */
function getWebpackCfgOf(env) {

    return {
        mode: env,
        context: pathOf("."),
        entry: {
            app: pathOf("src/app.js")
        },
        output: {
            filename: "js/app.js",
            path: pathOf("dist"),
            publicPath: "./"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                filename: "index.html",
                template: pathOf("public/index.html")
            }),
            new CopyWebpackPlugin({patterns: [
                {from: pathOf("public/index.css"), to: "css"},
                {from: pathOf("public/left.png"),  to: "img"},
                {from: pathOf("public/right.png"), to: "img"},
            ]}),
            new webpack.BannerPlugin({
                banner: "by microanswer.  web:https://www.microanswer.cn version:" + packageJson.version
            })
        ]
    }
}

module.exports = getWebpackCfgOf;
