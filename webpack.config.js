const path = require("path");

module.exports = {
	mode: "development", // or 'production' for optimized builds
	entry: "./src/Demo.ts", // Your main TypeScript entry point
	devtool: "inline-source-map", // For easier debugging
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		filename: "bundle.js", // The output bundle file
		path: path.resolve(__dirname, "dist"), // Output directory
	},
	devServer: {
		static: "./dist", // Serve files from the output directory
	},
};
