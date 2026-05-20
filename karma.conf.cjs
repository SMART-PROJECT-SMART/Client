// Firefox Developer Edition support:
// - Prefer setting FIREFOX_BIN explicitly.
// - Default path matches standard Windows install location.
const path = require('path');

const DEFAULT_FIREFOX_DEV_BIN = 'C:\\Program Files\\Firefox Developer Edition\\firefox.exe';

module.exports = function (config) {
  // If user didn't set it, point to Firefox Developer Edition by default.
  // Karma Firefox launcher uses FIREFOX_BIN.
  process.env.FIREFOX_BIN = process.env.FIREFOX_BIN || DEFAULT_FIREFOX_DEV_BIN;

  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('./node_modules/@angular/build/src/builders/unit-test/karma-bridge.js'),
    ],
    browsers: ['FirefoxDevHeadless'],
    customLaunchers: {
      FirefoxDevHeadless: {
        base: 'Firefox',
        flags: ['-headless'],
      },
    },
    client: {
      clearContext: false,
    },
    reporters: ['progress', 'kjhtml'],
    coverageReporter: {
      dir: path.join(__dirname, './coverage/client'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
    restartOnFileChange: true,
  });
};

