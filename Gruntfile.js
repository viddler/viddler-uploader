module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          'src/upload.js': 'src/uploader.js.coffee'
        }
      }
    },
    concat: {
      dist: {
        src: ['src/upload.js','src/lib/plupload/js/plupload.full.min.js'],
        dest: 'js/upload.js',
      }
    },
    watch: {
      scripts: {
        files: ['**/*.js.coffee'],
        tasks: ['coffee', 'concat'],
        options: {
          spawn: false,
        },
      },
    },
  });


  grunt.registerTask('default', 'Compile', function() {
    grunt.task.run('coffee');
    grunt.task.run('concat');
  });
};
