// webpack.common.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    serviceWorker: './src/background/service-worker.js',
    content: './src/content/content.js',
    sidepanel: './src/panel/sidepanel.js',
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: './src/manifest.json',
          to: 'manifest.json',
          transform(content) {
            return Buffer.from(
              JSON.stringify({
                ...JSON.parse(content.toString()),
                version: process.env.npm_package_version,
              })
            );
          },
        },
        { from: './src/panel/sidepanel.html', to: 'sidepanel.html' },
        { from: './images', to: 'images' },
        { from: './src/data/dictionaries', to: 'dictionaries' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
};
