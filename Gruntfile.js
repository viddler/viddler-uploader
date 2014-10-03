module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');

  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          'js/upload.js': ['src/uploader.js.coffee']
        }
      }
    }
  });


  grunt.registerTask('default', 'Compile', function() {
    grunt.task.run('coffee');
  });
};
