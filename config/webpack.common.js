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
    constants: "./src/utils/constants.js",
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "[name].js",
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    extensions: [".js", ".jsx"],
    modules: ["src", "node_modules"],
    alias: {
      "@": path.resolve(__dirname, "../src"),
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
          from: "./src/manifest.json",
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
        { from: "./src/panel/sidepanel.html", to: "sidepanel.html" },
        { from: "./images", to: "images" },
        { from: "./src/data/dictionaries", to: "dictionaries" },
        {
          from: "./src/utils/constants.js",
          to: "utils/constants.js",
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
};
