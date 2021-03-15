const Multivocal = require('multivocal');

const config = {
  Setting: {
    Page: {
      Url: "https://{{Hostname}}/index.html?session={{Session.StartTime}}"
    }
  }
};
new Multivocal.Config.Simple( config );

require('./action.js').init();
require('./color.js').init();
require('./number.js').init();

exports.webhook = Multivocal.processFirebaseWebhook;
