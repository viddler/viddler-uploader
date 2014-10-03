module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          'js/upload.js': ['src/uploader.js.coffee']
        }
      }
    },
    watch: {
      scripts: {
        files: ['**/*.js.coffee'],
        tasks: ['coffee'],
        options: {
          spawn: false,
        },
      },
    },
  });


  grunt.registerTask('default', 'Compile', function() {
    grunt.task.run('coffee');
  });
};
