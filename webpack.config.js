const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
      {
        test: /\.tsx$/,
        use: "ts-loader",
      },
      {
        test: /\.jsx$/,
        use: "babel-loader",
      },
      {
        test: /\.json$/,
        use: "json-loader",
      },
    ],
  },
};