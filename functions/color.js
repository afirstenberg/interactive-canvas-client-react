const Multivocal = require('multivocal');
const Util = require('multivocal/lib/util');

const config = {
  Level: {
    "Action.color": "{{Val 'Session/Consecutive/Node.color'}}"
  },
  Local: {
    und: {
      Response: {
        "Action.color.1": [
          "What color should I show?"
        ],
        "Action.color": [''],
        "Action.showColor": [
          {
            Base: {Set: true},
            Template: {
              Page: {
                "scene": "color",
                "color": "{{color}}"
              }
            },
          },
          "And a lovely shade of {{color}} it is, too.",
          "I agree that {{color}} is nice.",
          "One spinner with {{color}} coming right up."
        ]
      },
      Suffix: {
        "Action.color":[''],
        "Action.showColor": [
          "What color next, or would you like to talk about numbers?"
        ]
      }
    }
  }
};

function buildColor( env ){
  env.color = Util.objPath( env, 'Parameter/color' );
  return Promise.resolve( env );
}

exports.init = function(){
  Multivocal.addBuilder( buildColor );
  new Multivocal.Config.Simple( config );
};
