/** @type {import('ts-jest')} */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.{js,ts}'
    ],
    collectCoverageFrom: [
        'src/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'tsx', 'json'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest']
    },
    globals: {
        'ts-jest': {
            tsconfig: {
                esModuleInterop: true,
                module: 'commonjs'
            }
        }
    }
};
