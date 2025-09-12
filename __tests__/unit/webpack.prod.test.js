// Mock TerserPlugin so we can deterministically inspect constructor options
jest.mock("terser-webpack-plugin", () => {
  return class TerserPluginMock {
    constructor(options) {
      this.options = options;
    }
  };
});

const TerserPlugin = require("terser-webpack-plugin");
const webpackConfig = require("../../webpack/webpack.prod.js");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

describe("webpack.prod.js configuration", () => {
  test("should use TerserPlugin with correct options", () => {
    // Expect minimizer[0] to be TerserPlugin (pinned to current config)
    expect(Array.isArray(webpackConfig.optimization.minimizer)).toBe(true);
    const firstMinimizer = webpackConfig.optimization.minimizer[0];
    // With the mock, the instance will be of the mocked class
    expect(firstMinimizer).toBeInstanceOf(TerserPlugin);

    const terserPlugin = firstMinimizer;

    expect(terserPlugin).toBeInstanceOf(TerserPlugin);
    // Current plugin exposes an options bag with terserOptions + extractComments/parallel
    const opts = terserPlugin.options;
    expect(opts).toBeDefined();
    expect(opts.extractComments).toBe(false);
    expect(opts.parallel).toBe(true);

    const tOpts = opts.terserOptions;
    expect(tOpts).toBeDefined();
    expect(tOpts.format).toBeDefined();
    expect(tOpts.format.comments).toBe(false);
  });

  test("should use CssMinimizerPlugin", () => {
    // Expect minimizer[1] to be CssMinimizerPlugin and only one instance present
    const minimizers = webpackConfig.optimization.minimizer;
    const cssPlugin = minimizers[1];
    expect(cssPlugin).toBeInstanceOf(CssMinimizerPlugin);
    const cssCount = minimizers.filter(
      (p) => p instanceof CssMinimizerPlugin,
    ).length;
    expect(cssCount).toBe(1);
  });

  test("should have production mode and source-map devtool", () => {
    expect(webpackConfig.mode).toBe("production");
    expect(webpackConfig.devtool).toBe("source-map");
  });

  test("should have correct optimization settings", () => {
    const { optimization } = webpackConfig;
    expect(optimization.minimize).toBe(true);
    expect(optimization.splitChunks.chunks).toBe("all");
    expect(optimization.splitChunks.name).toBe(false);
    expect(optimization.runtimeChunk.name).toBe("runtime");
  });

  test("should have correct splitChunks cacheGroups configuration", () => {
    const { cacheGroups } = webpackConfig.optimization.splitChunks;

    expect(cacheGroups.vendors.test.toString()).toContain("node_modules");
    expect(cacheGroups.vendors.priority).toBe(-10);
    expect(cacheGroups.vendors.reuseExistingChunk).toBe(true);
    expect(typeof cacheGroups.vendors.name).toBe("function");

    // Verify current vendor name generator behavior for an unscoped package
    const name = cacheGroups.vendors.name({
      context: "/project/node_modules/react/index.js",
    });
    expect(name).toBe("vendor.react");

    expect(cacheGroups.common.minChunks).toBe(2);
    expect(cacheGroups.common.priority).toBe(-20);
    expect(cacheGroups.common.reuseExistingChunk).toBe(true);
    expect(cacheGroups.common.name).toBe("common");
  });

  describe("BundleAnalyzerPlugin configuration", () => {
    const originalEnv = process.env.ANALYZE;

    afterEach(() => {
      process.env.ANALYZE = originalEnv;
      jest.resetModules();
    });

    test("should include BundleAnalyzerPlugin when ANALYZE is true", () => {
      process.env.ANALYZE = "true";
      jest.resetModules();
      const configWithAnalyzer = require("../../webpack/webpack.prod.js");
      const analyzer = (configWithAnalyzer.plugins || []).find(
        (p) =>
          p && p.constructor && p.constructor.name === "BundleAnalyzerPlugin",
      );
      expect(
        analyzer && analyzer.constructor && analyzer.constructor.name,
      ).toBe("BundleAnalyzerPlugin");
      expect(analyzer.opts.analyzerMode).toBe("static");
      expect(analyzer.opts.reportFilename).toBe("bundle-analysis.html");
      expect(analyzer.opts.openAnalyzer).toBe(false);
    });

    test("should not include BundleAnalyzerPlugin when ANALYZE is not set", () => {
      process.env.ANALYZE = undefined;
      const configWithoutAnalyzer = require("../../webpack/webpack.prod.js");
      const hasAnalyzer = (configWithoutAnalyzer.plugins || []).some(
        (p) => p instanceof BundleAnalyzerPlugin,
      );
      expect(hasAnalyzer).toBe(false);
    });
  });
});
