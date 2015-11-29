module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
     ts: {
            default: {
                src: ["**/*.ts", "!node_modules/**/*.ts"],
                
                options: {
                    comments: true
                },
                out: "build/angular-applicationinsights.js"
            }
        },
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
        src: ['src/header.js','build/angular-applicationinsights.js', 'src/footer.js' ],
        dest: 'build/angular-applicationinsights.js',
      },
    },
    
    strip_code: {
    options: {
      start_comment: "test-code",
      end_comment: "end-test-code",
    },
    your_target: {
      // a list of files you want to strip code from
      src: "build/*.js"
    }
  }

  });

  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks('grunt-strip-code');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma-coveralls');

  
  grunt.registerTask('default', ['ts', 'karma', 'concat', 'strip_code', 'uglify']);
  grunt.registerTask('travis',['ts','karma','concat','strip_code','uglify','coveralls']);

};