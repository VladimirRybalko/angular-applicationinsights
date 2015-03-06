module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> version <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    coveralls: {
      options: {
          debug: true,
          coverageDir: 'coverage/',
          dryRun: false,
          force: false,
          recursive: true
      }
    },
    jshint: {
      all: ['src/**/*js', 'build/angular-applicationinsights.js', 'test/**/*.js']
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    concat: {
      options: {
        separator: '\n',
      },
      dist: {
        src: ['src/header.js','src/stackFrame.js', 'src/stackParser.js', 'src/storage.js', 'src/angular-applicationinsights.js', 'src/footer.js' ],
        dest: 'build/angular-applicationinsights.js',
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma-coveralls');

  
  grunt.registerTask('default', ['concat','jshint','karma','uglify']);
  grunt.registerTask('travis',['concat','jshint','karma','uglify','coveralls']);

};