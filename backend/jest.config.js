/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\.(ts|js)$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
};

export default config;