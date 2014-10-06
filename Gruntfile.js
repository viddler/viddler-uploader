module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-handlebars');

  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          'src/upload.js': 'src/uploader.js.coffee',
          'src/uploader-gui.js': 'src/uploader-gui.js.coffee',
        }
      }
    },
    handlebars: {
      compile: {
        'src/templates.html': 'src/templates.html.js'
      }
    },
    concat: {
      dist: {
        src: ['src/upload.js', 'src/uploader-gui.js', 'src/lib/handlebars/handlebars.min.js',
              'src/lib/plupload/js/plupload.full.min.js', 'src/templates.html.js'],
        dest: 'js/upload.js',
      }
    },
    watch: {
      scripts: {
        files: ['**/*.js.coffee'],
        tasks: ['default'],
        options: {
          spawn: false,
        },
      },
    },
  });


  grunt.registerTask('default', 'Compile', function() {
    grunt.task.run('coffee');
    grunt.task.run('handlebars:compile');
    grunt.task.run('concat');
  });
};
