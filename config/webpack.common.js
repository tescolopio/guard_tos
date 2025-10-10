// config/webpack.common.js
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  entry: {
    serviceWorker: "./src/background/serviceWorker.js",
    content: "./src/content/content.js",
    sidepanel: "./src/panel/sidepanel.js",
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".js", ".jsx"],
    modules: ["src", "node_modules"],
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      util: require.resolve("util/"),
      vm: require.resolve("vm-browserify"),
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: "./manifest.json",
          to: "manifest.json",
          transform(content) {
            return Buffer.from(
              JSON.stringify({
                ...JSON.parse(content.toString()),
                version: process.env.npm_package_version,
              }),
            );
          },
        },
        {
          from: "./src/panel/sidepanel.html",
          to: "sidepanel.html",
          transform(content) {
            // rewrite asset paths for dist root
            let html = content.toString();
            html = html.replace("../styles/styles.css", "./styles.css");
            html = html.replace("../utils/constants.js", "./constants.js");
            html = html.replace("../utils/debugger.js", "./debugger.js");
            html = html.replace("sidepanel.js", "./sidepanel.js");
            return Buffer.from(html);
          },
        },
        // Copy utility files needed by sidepanel.html
        {
          from: "./src/utils/constants.js",
          to: "constants.js",
        },
        {
          from: "./src/utils/debugger.js",
          to: "debugger.js",
        },
        // Ship sample analysis payload for in-panel demo
        {
          from: "./data/sample_analysis.json",
          to: "sample/sample_analysis.json",
        },
        { from: "./images", to: "images" },
        { from: "./src/styles/styles.css", to: "styles.css" },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
};
