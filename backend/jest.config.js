/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\.js$': 'babel-jest',
  },
};

export default config;