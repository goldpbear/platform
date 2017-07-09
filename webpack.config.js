require('dotenv').config({path: 'src/.env'});
require("babel-polyfill");
var path = require('path');
var glob = require('glob');
var fs = require('fs');
var yaml = require('js-yaml');
var Gettext = require("node-gettext");
var gettextParser = require("gettext-parser");
var walk = require("object-walk");

var flavorJsFiles = glob.sync("./src/flavors/" + process.env.FLAVOR + "/static/js/*.js");
var entryPoints = ["babel-polyfill", "./src/base/static/js/routes.js", "./src/base/static/js/handlebars-helpers.js"].concat(flavorJsFiles);

var baseViewPaths = glob.sync(path.resolve(__dirname, 'src/base/static/js/views/*.js'));
var alias = {};

for (var i = 0; i < baseViewPaths.length; i++) {
  var baseViewPath = baseViewPaths[i];
  var viewName = baseViewPath.match(/\/([^\/]*)\.js$/)[1];
  var aliasName = 'mapseed-' + viewName + '$';
  var flavorViewPath = path.resolve(__dirname, 'src/flavors', process.env.FLAVOR, 'static/js/views/', viewName + '.js');
  if (fs.existsSync(flavorViewPath)) {
    alias[aliasName] = flavorViewPath;
  } else {
    alias[aliasName] = baseViewPath;
  }
}

var flavorBasePath = path.resolve(__dirname, 'src/flavors', process.env.FLAVOR);

// Parse config.yml to JSON
var flavorConfigPath = path.resolve(flavorBasePath, 'config.yml');
var config = yaml.safeLoad(fs.readFileSync(flavorConfigPath));

// Run gettext on the parsed config, once for each language for this flavor, 
// producing localized versions of the config.
// TODO: A build option that skips localization, so we don't have to do all the
// localization work on every dev build. We could also have a special dev build
// option that _does_ localize, for times when we want to test the localizations.
const MESSAGES_DIR = 'LC_MESSAGES';
const PO_FILE_NAME = 'django.po';
const GETTEXT_REGEX = /^_\(/;
var gt = new Gettext();
var localeDir = path.resolve(flavorBasePath, 'locale');
fs.readdirSync(localeDir).forEach((langDir) => {

  // Quick and dirty config clone:
  var thisConfig =  JSON.parse(JSON.stringify(config));
  var input = fs.readFileSync(path.resolve(localeDir, langDir, MESSAGES_DIR, PO_FILE_NAME));
  var po = gettextParser.po.parse(input);
  gt.addTranslations(langDir, "messages", po);
  gt.setTextDomain("messages");
  gt.setLocale(langDir);

  // TODO: Let's try to only walk the config structure once, performing gettext
  // replacements for all languages during that walk.
  walk(thisConfig, (val, prop, obj) => {
    if (typeof val === "string") {
      if (GETTEXT_REGEX.test(val)) {
        val = val
          .replace(GETTEXT_REGEX, "")
          .replace(/\)$/, "");
      }

      obj[prop] = gt.gettext(val);
    }
  });

  var filename = path.resolve(flavorBasePath, "config-" + langDir + ".json");
  fs.writeFileSync(filename, JSON.stringify(thisConfig));
});


// TODO: Precompile and localize Handlebars templates


module.exports = {
  entry: entryPoints,
  output: {
    path: "./src/base/static/dist/",
    filename: "bundle.js"
  },
  resolve: {
    alias: alias
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  }
};
