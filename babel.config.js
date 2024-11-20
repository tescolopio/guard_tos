module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          chrome: '88', // Manifest V3 minimum
        },
        useBuiltIns: 'usage',
        corejs: 3,
        modules: 'auto',
      },
    ],
    '@babel/preset-react',
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: 'commonjs',
          },
        ],
        '@babel/preset-react',
      ],
    },
    development: {
      sourceMaps: 'inline',
      presets: [
        [
          '@babel/preset-env',
          {
            debug: true,
            useBuiltIns: 'usage',
            corejs: 3,
          },
        ],
        '@babel/preset-react',
      ],
    },
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            useBuiltIns: 'usage',
            corejs: 3,
          },
        ],
        '@babel/preset-react',
      ],
      plugins: [
        [
          'transform-remove-console',
          {
            exclude: ['error', 'warn'],
          },
        ],
      ],
    },
  },
  ignore: ['node_modules', 'dist', '**/*.spec.js', '**/*.test.js'],
};
