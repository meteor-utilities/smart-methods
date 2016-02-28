Package.describe({
  name: "utilities:smart-methods",
  summary: "Smart methods",
  version: "0.1.0",
  git: "https://github.com/meteor-utilities/smart-methods.git"
});

Package.onUse(function (api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'mongo',
    'ecmascript@0.1.6',
    'check',
    'aldeed:simple-schema@1.5.3',
    'aldeed:collection2@2.8.0'
  ]);

  api.addFiles([
    'lib/smart-methods.js'
  ], ['client', 'server']);

  api.addFiles([
  ], ['server']);

});
