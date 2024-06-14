import modCss from "./RecordingLabel.module.css"

function RecordingLabel() {
  return (<div className={modCss.wrapper}>
    <div className={modCss.recCircleWrapper}>
  <div className={modCss.recCircle}></div>

    </div>
    <h3 className={modCss.textLabel}> 
    Rec
</h3> 
</div>
  )
}

export default RecordingLabel