const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const packageJson       = require("../package.json");
const webpack           = require("webpack");
const path              = require("path");
const fs                = require("fs");


const ProjectRoot       = path.resolve(__dirname, "../");
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
            filename: "app.js",
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
                template: pathOf("public/index.html"),
                useCNZZ:  fs.existsSync("C:/microanswer") && env === "production"
            }),
            new CopyWebpackPlugin({patterns: [
                {from: "./**/*", to: "./",context: pathOf("./public/")},
            ], options: {

            }}),
            new webpack.BannerPlugin({
                banner: "By Microanswer.  url:" + packageJson.url + " version:" + packageJson.version
            })
        ]
    }
}

module.exports = getWebpackCfgOf;
