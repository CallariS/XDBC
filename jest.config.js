/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    silent: true,
    testPathIgnorePatterns: ["<rootDir>/dist/"],
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/Demo.ts",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    coverageThreshold: {
        global: {
            statements: 60,
            branches: 38,
            functions: 55,
            lines: 60,
        },
    },
    preset: "ts-jest",
    testEnvironment: "jsdom",
    extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.ts$": "$1",
    },
    transform: {
        "^.+\\.(ts|tsx)?$": [
            "ts-jest",
            {
                allowImportingTsExtensions: true,
                tsconfig: "tsconfig.test.json",
            },
        ],
    },
};
