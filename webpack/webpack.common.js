// webpack/webpack.common.js
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    serviceWorker: path.resolve(
      __dirname,
      "../src/background/serviceWorker.js",
    ),
    content: path.resolve(__dirname, "../src/content/content.js"),
    sidepanel: path.resolve(__dirname, "../src/panel/sidepanel.js"),
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../manifest.json"),
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
          from: path.resolve(__dirname, "../src/panel/sidepanel.html"),
          to: "sidepanel.html",
        },
        { from: path.resolve(__dirname, "../images"), to: "images" },
        {
          from: path.resolve(__dirname, "../src/data/dictionaries"),
          to: "dictionaries",
        },
        {
          from: path.resolve(__dirname, "../data/sample_analysis.json"),
          to: "sample/sample_analysis.json",
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
};
