const Multivocal = require('multivocal');
const Util = require('multivocal/lib/util');

const config = {
  Level: {
    "Action.promptNumber": "{{Val 'Session/Consecutive/Node.number'}}"
  },
  Local: {
    und: {
      Response: {
        "Action.promptNumber":[""],
        "Action.showNumber": [
          {
            Template: {
              Page: {
                "scene": "number",
                "number": "{{number}}"
              },
              Markdown: "Here we go. {{#each numberList}}[500ms][mark:'number-{{this}}']{{this}} {{/each}}"
            }
          }
        ]
      },
      Suffix: {
        "Action.promptNumber": [""],
        "Action.promptNumber.1": [
          "What number do you want?",
          "What should we count to?"
        ],
        "Action.showNumber": [
          "What number next, or should we talk about colors?"
        ]
      }
    }
  }
};

function buildNumber( env ){
  env.number = Util.objPath( env, 'Parameter/number' );

  env.numberList = [];
  for( let co=1; co<=env.number; co++ ){
    env.numberList.push( co );
  }

  return Promise.resolve( env );
}

exports.init = function(){
  Multivocal.addBuilder( buildNumber );
  new Multivocal.Config.Simple( config );
}