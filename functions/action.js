const Multivocal = require( "multivocal" );

const config = {
  Local: {
    und: {
      Response: {
        "Action.welcome": [
          {
            Base:{Set:true},
            Template: {
              Page: {
                "scene": "welcome"
              }
            }
          },
          "Hello!",
          "Greetings!"
        ]
      },
      Suffix: {
        "Default": [
          "What next?"
        ],
        "Action.welcome": [
          "Would you like to talk about colors or numbers?"
        ]
      }
    }
  }
};

exports.init = function(){
  new Multivocal.Config.Simple( config );
};