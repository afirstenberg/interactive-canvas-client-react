import './App.css';
import {useEffect, useState} from "react";
import Color from "./Color";
import Number from "./Number";

function App() {

  /* The data updates sent from the server */
  const [data, setData] = useState({scene:''});
  const [marks, setMarks] = useState([]);

  /*
    Register window keyboard events to do some testing on the desktop
   */
  useEffect( () => {
    window.onkeydown = function( e ){
      data.code = e.code;
      switch(e.code){
        case 'Digit1': return setData({...data,scene:'welcome'});
        case 'Digit2': return setData({...data,scene:'color'});
        case 'Digit3': return setData({...data,scene:'number'});
        default:       return setData({...data,scene:'error'});
      }
    }
  }, [] );

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

  /**
    Register Interactive Canvas event handler
   */
  useEffect( () => {
    window.assistantCanvas.ready({
      onUpdate:  onUpdate,
      onTtsMark: onTtsMark
    })
  }, [] );

  return (
    <div className="App">
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
    </div>
  );
}

export default App;
