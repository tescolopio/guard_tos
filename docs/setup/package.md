Your `package.json` file provides a comprehensive setup for your JavaScript-based web browser extension application. Below is a detailed documentation of the key sections:

### Metadata

- **name**: `terms-guardian`
- **version**: `1.0.0`
- **private**: `true` (indicates that the package is not intended to be published to the npm registry)
- **engines**: Specifies that the project requires Node.js version `>=18.0.0`

### Scripts

The `scripts` section defines various commands that can be run using `npm run <script-name>` or `yarn <script-name>`:

- **dev**: Runs the development build with Webpack using the `webpack.dev.js` configuration and watches for changes.
- **build**: Runs the production build with Webpack using the `webpack.prod.js` configuration.
- **test**: Runs tests using Jest.
- **test:watch**: Runs tests using Jest in watch mode.
- **lint**: Lints JavaScript files in the `src` directory using ESLint.
- **format**: Formats JavaScript, HTML, and CSS files in the `src` directory using Prettier.
- **clean**: Removes the `dist` directory using Rimraf.
- **prepare**: Installs Husky for Git hooks.

### Dependencies

The `dependencies` section lists the runtime dependencies required by your application:

- **cheerio**: A fast, flexible, and lean implementation of core jQuery designed specifically for the server.
- **compromise**: A lightweight, extensible natural language processing library.
- **mammoth**: Converts Word documents (.docx files) to HTML.
- **pdfjs-dist**: A general-purpose, web standards-based platform for parsing and rendering PDFs.

### DevDependencies

The `devDependencies` section lists the development dependencies required for building, testing, and maintaining your application:

- **@babel/core**: The core of Babel, used for transpiling JavaScript.
- **@babel/preset-env**: A smart preset that allows you to use the latest JavaScript without needing to micromanage which syntax transforms (and optionally, browser polyfills) are needed by your target environment(s).
- **@babel/preset-react**: A Babel preset for React.
- **@testing-library/jest-dom**: Custom Jest matchers to test the DOM.
- **babel-loader**: A Webpack loader for Babel.
- **babel-plugin-transform-remove-console**: A Babel plugin to remove `console` statements.
- **copy-webpack-plugin**: A Webpack plugin to copy files and directories.
- **css-loader**: A Webpack loader for CSS files.
- **eslint**: A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
- **husky**: A tool for managing Git hooks.
- **jest**: A delightful JavaScript testing framework with a focus on simplicity.
- **jest-environment-jsdom**: A Jest environment that uses jsdom to provide a browser-like environment for testing.
- **mini-css-extract-plugin**: A Webpack plugin to extract CSS into separate files.
- **prettier**: An opinionated code formatter.
- **rimraf**: A deep deletion module for Node.js.
- **webpack**: A module bundler for JavaScript applications.
- **webpack-cli**: A command-line interface for Webpack.
- **webpack-merge**: A helper to merge Webpack configurations.

### Package Manager

- **packageManager**: Specifies that Yarn version `4.5.1` is used as the package manager.
