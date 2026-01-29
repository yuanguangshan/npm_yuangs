/** @type {import('ts-jest')} */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 10000,
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
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.[tj]sx?$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                module: 'commonjs',
                allowJs: true
            }
        }]
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(ora|marked|marked-terminal)/)'
    ],
    moduleNameMapper: {
        '^ora$': '<rootDir>/test/__mocks__/ora.js',
        '^marked$': '<rootDir>/test/__mocks__/marked.js',
        '^marked-terminal$': '<rootDir>/test/__mocks__/marked-terminal.js'
    },
};
