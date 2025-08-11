/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\.(ts|js)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};

export default config;