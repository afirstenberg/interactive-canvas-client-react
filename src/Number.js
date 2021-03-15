import {useState} from "react";

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