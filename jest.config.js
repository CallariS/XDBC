/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	silent: true,
	testPathIgnorePatterns: ["<rootDir>/dist/"],
	testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
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
