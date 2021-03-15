import Spinner from "./Spinner";

const buttonColors = [
  "Red",
  "Green",
  "Blue"
];

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

export default function Color({data}){
  return(
    <div className="Color">
      <Spinner fillColor={data.color || 'black'}/>
      <div className="buttons">
        {
          buttonColors.map( color => <ColorButton color={color}/>)
        }
      </div>
    </div>
  )
}