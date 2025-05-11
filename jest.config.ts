/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	silent: true,
	testPathIgnorePatterns: ["<rootDir>/dist/"],
	testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"], // Example default
	preset: "ts-jest", // This should be at the top to set the base configuration
	testEnvironment: "jsdom",
	extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.ts$": "$1", // This line is for compiled JS, let's adjust for TS
	},
	transform: {
		"^.+\\.(ts|tsx)?$": [
			"ts-jest",
			{
				allowImportingTsExtensions: true,
			},
		],
	},
};
