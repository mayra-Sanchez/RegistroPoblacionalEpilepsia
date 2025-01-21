module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('@angular-devkit/build-angular/plugins/karma')
      ],
      client: {
        clearContext: false // Mantener el navegador abierto después de las pruebas
      },
      jasmineHtmlReporter: {
        suppressAll: true // No mostrar reportes HTML, solo en consola
      },
      coverageReporter: {
        dir: require('path').join(__dirname, './coverage'),
        subdir: '.',
        reporters: [
          { type: 'html' },
          { type: 'lcovonly' }
        ]
      },
      reporters: ['progress', 'kjhtml'],
      browsers: ['Chrome'],
      singleRun: false,
      restartOnFileChange: true
    });
  };
  