const path = require("path");
const webpackConfig = require("../../webpack/webpack.common.js");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

describe("webpack.common.js configuration", () => {
  test("entry points are correct", () => {
    expect(webpackConfig.entry).toEqual({
      serviceWorker: path.resolve(__dirname, "../../src/background/serviceWorker.js"),
      content: path.resolve(__dirname, "../../src/content/content.js"),
      sidepanel: path.resolve(__dirname, "../../src/panel/sidepanel.js"),
    });
  });

  test("output configuration is correct", () => {
    expect(webpackConfig.output).toEqual({
      path: path.resolve(__dirname, "../../dist"),
      filename: "[name].js",
      clean: true,
    });
  });

  test("module rules are correct", () => {
    expect(webpackConfig.module.rules).toEqual([
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
    ]);
  });

  test("plugins configuration is correct", () => {
    expect(webpackConfig.plugins).toEqual(
      expect.arrayContaining([
        expect.any(CopyPlugin),
        expect.any(MiniCssExtractPlugin),
      ]),
    );

    const copyPlugin = webpackConfig.plugins.find(
      (plugin) => plugin instanceof CopyPlugin,
    );

    expect(copyPlugin).toBeDefined();
    expect(copyPlugin.patterns).toEqual([
      {
        from: path.resolve(__dirname, "../../manifest.json"),
        to: "manifest.json",
        transform: expect.any(Function),
      },
      { from: path.resolve(__dirname, "../../src/panel/sidepanel.html"), to: "sidepanel.html" },
      { from: path.resolve(__dirname, "../../images"), to: "images" },
      { from: path.resolve(__dirname, "../../src/data/dictionaries"), to: "dictionaries" },
    ]);
  });
});
