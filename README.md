# React and the Google Assistant Interactive Canvas

This project was demonstrated at the Voice Lunch Developers session on
Feb 25th 2021.

It was bootstrapped from [Create React App](https://github.com/facebook/create-react-app),
and still maintains many legacies that I didn't bother to delete. I'll focus
on what is done specifically for the Interactive Canvas.

## Directory Structure

### public

Contains the static public files/resources used to build the React app. The
most important bit here is the `index.html` file, and I'll outline the
changes below.

### src

Contains the React source. `App.js` is the main code here, and `Number.js`,
`Color.js`, and `Spinner.js` are the main code additions that I outline
below.

### functions

Contains a webhook used for Actions on Google. This is written using the
[multivocal](https://multivocal.info/) library and meant to run on
Cloud Functions for Firebase. 

### sdk

Contains the configuration that you can upload to the Actions Builder
using the `gactions` command line utility.
  
## React File walk-through

### index.html

This is the standard React file, with the addition of two lines that are used
to load the Interactive Canvas JavaScript libraries:

```javascript
    <!--
      Load Immersive Canvas libraries
    -->
    <link rel="stylesheet" href="https://www.gstatic.com/assistant/immersivecanvas/css/styles.css" />
    <script type="text/javascript" src="https://www.gstatic.com/assistant/immersivecanvas/js/immersive_canvas_api.js"></script>
```

### App.js

Most of the interaction with Actions on Google and the Interactive Canvas library
is done in App.js. As with most React components, this is where the state changes
and the state will be handed to sub-components.

#### Initializing things

The Interactive Canvas library installs itself in the `windows.assistantCanvas`
JavaScript object, and we need to call the `ready()` function on it to setup
callbacks for Interactive Canvas events. This will be done in a React [Effect
hook](https://reactjs.org/docs/hooks-effect.html) so it is initialized when React 
initially renders the `<App>`.

```javascript
  /**
    Register Interactive Canvas event handler
   */
  useEffect( () => {
    window.assistantCanvas.ready({
      onUpdate:  onUpdate,
      onTtsMark: onTtsMark
    })
  }, [] );
```

This registered two functions that will be called for specific Interactive
Canvas events.

#### onUpdate

The `onUpdate` function will be called when the webhook sends back a reply
that includes data. This is an array of objects, and we'll use them to update
the current data object that we maintain as state. This data includes things
such as the name of the scene (which we will use to flip between what we show)
and the color the user has chosen (which, for the "color" scene, we will use
to display something in that color).

```javascript
  const [data, setData] = useState({scene:''});

  /**
   * When we get an update, set the data from it as our new state
   * @param newData[] Array of Objects sent by server
   */
  function onUpdate( newData ){
    console.log('onUpdate',newData);
    let toSet = {...data};
    newData.forEach( newDataItem => {
      toSet = {...toSet, ...newDataItem};
    });
    setData( toSet );
  }
```

#### onTtsMark

The `onTtsMark` function gets called while the speaker on your Google Assistant
device is generating audio (or "text to speech"). Each time a "mark" is hit,
this function is called with the name of the mark. "START" and "END" marks are
always sent when, you guessed it, the audio begins and ends. Additionally, if 
you return an SSML `<mark>` tag, these marks will also be included in the appropriate
place.

We'll maintain a list of the marks that have been sent, clearing them out when
we get the "START" tag, so that we can show them in one of the scenes.

```javascript
  const [marks, setMarks] = useState([]);
  /**
   * As we get marks from the SSML, add them to a list. Clear the list when
   * we get the first mark.
   * @param mark
   */
  function onTtsMark( mark ){
    if( mark === 'START' ){
      setMarks(['START']);
    } else {
      setMarks( oldMarks => [...oldMarks, mark] );
    }
  }
```

#### Making a scene

Our data will contain a `scene` attribute which indicates which scene should
be shown. React renders the appropriate children when the state is changed
(as long as its changed using the functions that are created by the React
[State hooks](https://reactjs.org/docs/hooks-state.html), which I do). This
rendering is done as part of the JSX that gets returned:

```jsx
      <div>
        Scene: {data.scene}
      </div>
      <div>
        {(() => {
          switch( data.scene ){
            case 'color': return(<Color data={data}/>);
            case 'number': return(<Number marks={marks}/>);
            default:    return(<div>default</div>);
          }
        })()}
      </div>
```
### Color.js (and Spinner.js)

This implement the `<Color>` component, which shows a scene if the user requests
to work with colors and specifies what color they want.
We pass the full data object to the Color component so we
can get the values of any other attributes included, particularly the `color`
attribute which is what the user requested. There are two things shown in the
color scene

The first is a spinner, shown in the color the user has requested:

```jsx
      <Spinner fillColor={data.color || 'black'}/>
```

This spinner is implemented using SVG and JavaScript, and was based on the
code at [https://codepen.io/supah/pen/BjYLdW](https://codepen.io/supah/pen/BjYLdW).
Although this spinner is just SVG, a version that uses JavaScript with SVG or
any other method is possible as well

The second part of the scene are a row of buttons that can be used to change
the color of the spinner, in addition to the user saying something to change
the color.
```jsx
      <div className="buttons">
        {
          buttonColors.map( color => <ColorButton color={color}/>)
        }
      </div>
```

The `<ColorButton>` component renders an HTML button that calls a `sendcolor()`
function when it is clicked. This function calls the `sendTextQuery()` function
that is part of the `window.assistantCanvas` object to send the color name
to the Assistant, as if the user has spoken it.

```javascript
async function sendColor(color){
  const result = await window.assistantCanvas.sendTextQuery( color );
  console.log(result);
}

function ColorButton({color}){
  return(
    <button className="ColorButton" onClick={() => sendColor(color)}>
      {color}
    </button>
  )
}
```

### Number.js

The other scene will show when the user specifies a number to count to. This
shows an HTML list with the number that is being read aloud as it is read. This
list comes from the list of marks that are maintained in the App component, and
we make sure we don't generate a `<li>` component for the "START" or "END" tags.

```javascript
export default function Number({marks}){
  console.log('Number marks',marks);
  return(
    <div className="Number">
      <ul>
        {
          marks && marks.map( mark =>
            (mark !== 'START' && mark !== 'END' && <li>{mark}</li>)
          )
        }
      </ul>
    </div>
  )
}
```

## Webhook file walk-through

The webhook is implemented using [multivocal](https://multivocal.info/) which
provides a configuration- and template-driven way to handle requests that are
forwarded from the Assistant. This provides a brief explanation about the
configuration and how multivocal works.

### index.js

This is the file that is loaded by default. It does three tasks:

First, it loads settings to specify what the URL for the Interactive Canvas
will be. This is, itself, a template that uses the [handlebars](https://handlebarsjs.com/guide/)
templating system. `{{Hostname}}` is the hostname where the webhook is hosted,
assuming that your webhook and the React app are hosted at the same hostname
(which you can do with Firebase), and `{{Session.StartTime}}` resolves to the
time the Action session was started, and is used to make sure the React app
that is loaded is always the latest one.

```javascript
const config = {
  Setting: {
    Page: {
      Url: "https://{{Hostname}}/index.html?session={{Session.StartTime}}"
    }
  }
};
new Multivocal.Config.Simple( config );
```

Second, it calls other modules to initialize themselves as described below.
These do not have to be organized as other modules - they're just done this
way to help keep things organized.

```javascript
require('./action.js').init();
require('./number.js').init();
require('./color.js').init();
```

Finally, it sets up the Cloud Function to call multivocal's standard
handler for Cloud Functions for Firebase.

### action.js

This module defines generic responses and how we will handle our "welcome"
scene. 

Multivocal defines a number of ways that configuration can be loaded in, but
we'll be using JavaScript objects. There is a configuration object attribute
named "Local", indicating that the values under it are localized, but we will
use the "und" locale, which is a fallback if we can't find a matching locale
specified. We will be defining both "Response"s and "Suffix"es - multivocal
will select one of the responses that matches the handler name from the Assistant
and, if appropriate, one of the suffixes.

```javascript
const config = {
  Local: {
    und: {
      Response: {
        // ...
      },
      Suffix: {
        // ...
      }
    }
  }
};

exports.init = function(){
  new Multivocal.Config.Simple( config );
};
```

The suffixes are somewhat straightforward, since this illustrates just one
possible value for each. If the "welcome" handler is called, we will use the
values specified by "Action.welcome", otherwise we use the "Default" values.
The "Action." prefix is historical, other prefixes include "Intent." indicating
the Intent name that matched or other values can be set as part of our handling
which multivocal calls the "Outent".

```javascript
      Suffix: {
        "Default": [
          "What next?"
        ],
        "Action.welcome": [
          "Would you like to talk about colors or numbers?"
        ]
      }
```

The primary response section is a little more complicated. Although this
specifies two text responses as strings, it also specifies a "Base" object,
which acts as an object that is used as the basis of all the values that follow
it.

This base object, specifically, says that the "Page" object will be handled
through the template engine and will set the "scene" attribute to "welcome".
The "Page" object will be sent to the Interactive Canvas. Setting it as a Base
means that this Page object will be set for all of the other responses.

```javascript
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
```

### color.js

The color.js file is similar, but has a few more elements to it. It handles
when the user has specified that they want to talk about colors or have given
us a color to show.

When initializing this module, we also register a builder. Builders are called
every time the webhook is, and are usually used for taking parameters and
storing them in the multivocal session environment in a simpler form. In this
case, it takes the "color" parameter and stores it in the "color" attribute
of the session environment.

```javascript
function buildColor( env ){
  env.color = Util.objPath( env, 'Parameter/color' );
  return Promise.resolve( env );
}

exports.init = function(){
  Multivocal.addBuilder( buildColor );
  new Multivocal.Config.Simple( config );
};
```

We use this as part of the response in two ways. First, we'll include this in
the Page object, in a "color" attribute, to send the color to the Interactive
Canvas. Second, what we say will include the color.

```javascript
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
```

We also register a "level" calculator, so we know the first time a person
visits an Actions Builder scene (which multivocal calls a "Node") in a row.
This uses a built-in session counter that multivocal maintains.

```javascript
  Level: {
    "Action.color": "{{Val 'Session/Consecutive/Node.color'}}"
  },
```

This level is appended to the Action, Intent, or Outent name when evaluating 
responses and suffixes. If there are no matches with the level appended, then
it is evaluated without the level.

```javascript
        "Action.color.1": [
          "What color should I show?"
        ],
        "Action.color": [''],
```

### number.js

If the user requests to talk about numbers, we do a few things differently.

In addition to storing the number they request, we also have the builder add
to the session environment an array of all the numbers from 1 to the number 
requested. This makes a few things easier in our template.

```javascript
function buildNumber( env ){
  env.number = Util.objPath( env, 'Parameter/number' );

  env.numberList = [];
  for( let co=1; co<=env.number; co++ ){
    env.numberList.push( co );
  }

  return Promise.resolve( env );
}
```

In addition to sending back the number requested as part of our data to the
Interactive Canvas, we'll also set the audio response using the "Markdown"
attribute, which lets us use [SpeechMarkdown](https://speechmarkdown.org)
and the "mark" tag before the number itself would be said. We're using the
[Handlebars "each" helper](https://handlebarsjs.com/guide/builtin-helpers.html#each)
to iterate over all the numbers in the array that we set in the builder.


```javascript
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
```

## Other files of peripheral interest

### firebase.json

This file contains the information if you're using Firebase Hosting. There 
are two elements useful here.

The first is what directory Firebase Hosting will serve. This should be the
result of the React build process which is, by default, the "build" directory.

```javascript
    "public": "build",
```

The second is that we'll be using the same hostname for the webhook, so we
need to indicate that hitting the /webhook path at that hostname should
cause the Cloud Function named "webhook" to execute

```javascript
    "rewrites":[
      {
        "source": "/webhook",
        "function": "webhook"
      }
    ]
```

### sdk/settings/settings.yaml

We need to specify the Google Cloud project ID that our Action is using so
it can upload the configuration to the right project.

We also need to set that we're using the Interactive Canvas.

```yaml
projectId: YOUR-PROJECT-ID-HERE
usesInteractiveCanvas: true
```

### sdk/webhooks/ActionsOnGoogleFulfillment.yaml

We need to make sure you set the URL for the webhook to where the webhook
will be running. (The Actions Builder doesn't necessarily know we're using
Firebase Hosting, or we may be testing with a proxy.)

```yaml
httpsEndpoint:
  baseUrl: https://YOUR-WEBHOOK-HERE.EXAMPLE.COM/webhook
```

### sdk/actions/actions.yaml

Interactive Canvas is only available for limited verticals (or "Built In Intents"
- BII) including the "play a game" action.

```yaml
  actions.intent.PLAY_GAME: {}
```
