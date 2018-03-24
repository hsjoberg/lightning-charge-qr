module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      src: {
        files: ['vendor/bootstrap-4.0.0/scss/**/*.scss'],
        tasks: ['exec']
      },
    },
    exec: {
      compile_bootstrap: {
        command: 'cd vendor/bootstrap-4.0.0 && npm run css'//'cd vendor/bootstrap-4.0.0 && npm run watch'
      }
    }
  });

  /*grunt.loadNpmTasks('grunt-contrib-jshint');*/
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');

  //grunt.registerTask('default', ['jshint']);
  //grunt.registerTask('default', 'exec');
  grunt.registerTask('default', 'watch');
};
