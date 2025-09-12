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
    minimize: true, // Re-enable minification to debug Terser errors
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
      chunks: "async", // Only split async chunks (like dynamic imports)
      cacheGroups: {
        dictionaries: {
          test: /dict-[a-z]\.json$/,
          name: (module) => {
            // Extract letter from path like "dict-a.json" -> "dict-a"
            const match = module.resource.match(/dict-([a-z])\.json$/);
            return match ? `dict-${match[1]}` : "dict-unknown";
          },
          chunks: "async",
          priority: 10,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "initial",
          priority: 5,
        },
      },
    },
  },
  plugins: [...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])],
});
