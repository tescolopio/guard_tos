// config/webpack.prod.js
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const TerserPlugin = require("terser-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ["console.log"],
          },
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: "all",
      name: false,
    },
  },
  plugins: [...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])],
});
