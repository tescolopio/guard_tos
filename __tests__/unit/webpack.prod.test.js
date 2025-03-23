const webpackConfig = require("../../webpack/webpack.prod.js");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

describe("webpack.prod.js configuration", () => {
  test("should use TerserPlugin with correct options", () => {
    const terserPlugin = webpackConfig.optimization.minimizer.find(
      plugin => plugin instanceof TerserPlugin
    );

    expect(terserPlugin).toBeInstanceOf(TerserPlugin);
    expect(terserPlugin.options.terserOptions.format.comments).toBe(false);
    expect(terserPlugin.options.terserOptions.compress.drop_console).toBe(true);
    expect(terserPlugin.options.terserOptions.compress.drop_debugger).toBe(true);
    expect(terserPlugin.options.terserOptions.compress.pure_funcs).toEqual([
      "console.log",
      "console.info",
      "console.debug"
    ]);
    expect(terserPlugin.options.terserOptions.mangle).toBe(true);
    expect(terserPlugin.options.parallel).toBe(true);
  });

  test("should use CssMinimizerPlugin", () => {
    const cssPlugin = webpackConfig.optimization.minimizer.find(
      plugin => plugin instanceof CssMinimizerPlugin
    );
    expect(cssPlugin).toBeInstanceOf(CssMinimizerPlugin);
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
      const configWithAnalyzer = require("../../webpack/webpack.prod.js");
      
      const bundleAnalyzerPlugin = configWithAnalyzer.plugins[0];
      expect(bundleAnalyzerPlugin).toBeInstanceOf(BundleAnalyzerPlugin);
      expect(bundleAnalyzerPlugin.opts.analyzerMode).toBe('static');
      expect(bundleAnalyzerPlugin.opts.reportFilename).toBe('bundle-analysis.html');
      expect(bundleAnalyzerPlugin.opts.openAnalyzer).toBe(false);
    });

    test("should not include BundleAnalyzerPlugin when ANALYZE is not set", () => {
      process.env.ANALYZE = undefined;
      const configWithoutAnalyzer = require("../../webpack/webpack.prod.js");
      expect(configWithoutAnalyzer.plugins).toHaveLength(0);
    });
  });
});
