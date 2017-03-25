const BabiliPlugin = require("babili-webpack-plugin");

const IS_PROD = process.env.NODE_ENV === "production";

module.exports = {
  entry: "./js/index.js",
  output: {
    path: __dirname,
    filename: "js/bundle.js"
  },
  plugins: (
    IS_PROD ? [ new BabiliPlugin() ] : []
  ),
};
