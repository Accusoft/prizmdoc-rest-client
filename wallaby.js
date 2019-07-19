module.exports = function (/* wallaby */) {
  return {
    files: [
      'lib/**/*.js'
    ],
    tests: [
      'test/**/*test.js'
    ],
    env: {
      type: 'node'
    },
    workers: {
      recycle: true
    }
  };
};
