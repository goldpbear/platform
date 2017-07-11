require('dotenv').config({path: 'src/.env'});
require("babel-polyfill");
var path = require('path');
var glob = require('glob');
var fs = require('fs');
var yaml = require('js-yaml');
var Gettext = require("node-gettext");
var gettextParser = require("gettext-parser");
var walk = require("object-walk");
var Handlebars = require("handlebars");
var wax = require("wax-on");
var execSync = require("child_process").execSync;

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
const PO_FILE_NAME = 'django.po';
const GETTEXT_REGEX = /^_\(/;
const BASE_STATIC_URL = "/static/";
const FLAVOR_STATIC_URL = 
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// TODO: add this to .env
const CLICKY_ANALYTICS_ID = process.env.CLICKY_ANALYTICS_ID || "";

// TODO: add this to .env
const MAPQUEST_KEY = process.env.MAPQUEST_KEY || "";

// TODO: add this to .env
const GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID || "";

var gt = new Gettext();
var localeDir = path.resolve(flavorBasePath, 'locale');

Handlebars.registerHelper("serialize", function(json) {
  if (!json) return false;
  return JSON.stringify(json);
});

Handlebars.registerHelper("_", function(msg) {
  return gt.gettext(msg);
});

wax.on(Handlebars);

// TODO: replace Django template filters with Handlebars helpers

wax.setLayoutPath(path.resolve(flavorBasePath, "templates"));
var source = fs.readFileSync(path.resolve(flavorBasePath, "templates/index.html"), "utf8");
var template = Handlebars.compile(source);

fs.readdirSync(localeDir).forEach((langDir) => {

  // Quick and dirty config clone:
  var thisConfig =  JSON.parse(JSON.stringify(config));

  var input = fs.readFileSync(path.resolve(localeDir, langDir, "LC_MESSAGES", PO_FILE_NAME));
  var po = gettextParser.po.parse(input);
  gt.addTranslations(langDir, "messages", po);
  gt.setTextDomain("messages");
  gt.setLocale(langDir);

  // TODO: Walk the config structure only once, performing gettext replacements for 
  // all languages during that walk?
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

  // Precompile and localize Handlebars templates
  var baseJSTemplatesPath = path.resolve(__dirname, "src/base/jstemplates");
  var flavorJSTemplatesPath = path.resolve(flavorBasePath, "jstemplates");
  var handlebarsExec = path.resolve(__dirname, "node_modules/handlebars/bin/handlebars");
  var compiledTemplatesOutputPath = path.resolve(__dirname, "src/base/jstemplates/templates.js");

  // Precompile Handlebars templates
  execSync(handlebarsExec + " -e 'html' -m " + baseJSTemplatesPath + " -f " + compiledTemplatesOutputPath);


  // TODO: pages templates

  // Build the index.html file for this language, inheriting from base.hbs and
  // injecting the localized config.
  var result = template({
    config: thisConfig,
    settings: {
      MAPBOX_TOKEN: MAPBOX_TOKEN,
      CLICKY_ANALYTICS_ID: CLICKY_ANALYTICS_ID,
      MAPQUEST_KEY: MAPBOX_TOKEN,
      GOOGLE_ANALYTICS_ID: GOOGLE_ANALYTICS_ID,
    },
    BASE_STATIC_URL: BASE_STATIC_URL,

    // TODO: handle language code
    LANGUAGE_CODE: "en_US",

    // TODO: what are we going to do about session management?
    user_token_json: "",

    // TODO: user agent identification needs to be moved client-side
    user_agent_json: {
      browser: {
        name: "some browser name"
      }
    }
  });


  // Write out final index.html file
  var filename = path.resolve(flavorBasePath, "templates", "index-" + langDir + ".html");
  fs.writeFileSync(filename, result);
});




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
