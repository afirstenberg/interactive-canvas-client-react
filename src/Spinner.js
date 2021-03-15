import './Spinner.css';

/*
 * Based on https://codepen.io/supah/pen/BjYLdW
 */

export default function Spinner({fillColor = "#ffffff", ...props}){

  return(
    <div className="Spinner">
      <svg className="spinner" viewBox="0 0 50 50">
        <circle className="path"
                cx="25" cy="25"
                r="20"
                fill="none"
                stroke={fillColor}
                strokeWidth="5">
        </circle>
      </svg>
    </div>
  )
}