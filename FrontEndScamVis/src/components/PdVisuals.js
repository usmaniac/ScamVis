import React, { useState, useEffect } from 'react'
import FusionCharts from "fusioncharts";
import TimeSeries from "fusioncharts/fusioncharts.timeseries";
import ReactFC from "react-fusioncharts";

// Data tests
import jsondata from '../usmanTempData.json'
import tempdata from '../tempdata2.json'
import {  Row, Col, Container, } from 'react-bootstrap';



ReactFC.fcRoot(FusionCharts, TimeSeries);

const schemaTop = [{
  "name": "Date",
  "type": "date",
  "format": "%Y-%m-%d %H:%M:%S"
}, {
  "name": "Open",
  "type": "number"
}, {
  "name": "High",
  "type": "number"
}, {
  "name": "Low",
  "type": "number"
}, {
  "name": "Close",
  "type": "number"
}, {
  "name": "Volume",
  "type": "number"
}]


// props -> text for the caption

let dataSource = {
  caption: {
    text: "DENT/BTC Price"
  },
  
  chart: {
    exportenabled: 1,
    multicanvas: false,
    theme: "candy"
  },
  yaxis: [
    {
      plot: [
        {
          value: {
            open: "Open",
            high: "High",
            low: "Low",
            close: "Close"
          },
          type: "candlestick"
        }
      ],
      format: {
        prefix: "$"
      },
      title: "Stock Price"
    },
    {
      plot: [
        {
          value: "Volume",
          type: "column"
        }
      ],
      max: "90000000"
    }
  ],
  navigator: {
    enabled: 1
  }
};



function PdVisuals(props) {

    console.log("props.coin:", props.coin)
    console.log("price params:",props.priceParam)
    console.log("volume param:",props.volumeParam)
    console.log("anomalies:", props.anomalies)
   
    const [state, setState] = useState({
        timeSeriesList: [], 
    })

 
    const [items, setItems] = useState(
      [{
        label: "2nd Jan 2019",
        value: "2nd Jan 2019"
      },
      {
        label: "5th March 2019",
        value: "5th March 2019"
      }],
    );
    const[selected, setSelected] = useState("")
    
    const vizProperties = {
      type: "timeseries",
      renderAt: "container",
      width: "100%",
      height: "700",
      dataSource : {}
    }
   
    useEffect(() => {
      async function fillAnomalyList() {
        if(props.anomalies && props.anomalies.length > 0){
          setItems(
            props.anomalies.map((response ) => ({ label: response[0], value: response[1] })),
          );
        } else {
          console.log("props.anomalies is empty using default values")
        }
      }

      function onFetchData() {

        // may have to make this async (keep in mind)
        // replace json data 
        // all_data = props.data
        // props.anomalies = "anomalies": [ ["Fri, 22 Mar 2019 12:15:00 GMT", 7729] ]
        let newdata
        if (selected) {
          let increment = 100
          let end = parseInt(selected) + increment
          let start = parseInt(selected) - increment
          if (parseInt(selected)-increment < 0) {
              start = 0
          }
          if (end > parseInt(props.data.length - 1)) {
              end = parseInt(props.data.length - 1)
          }
          console.log("start", start, " end:", end, " last index:", props.data.length-1)
          newdata = props.data.slice(start,end)
          console.log("newdata: ", newdata)
        }
        else if(props.anomalies.length > 0){
          let defaultSelected = parseInt(props.anomalies[0][1])
          let increment = 100
          let end = parseInt(defaultSelected) + increment
          let start = parseInt(defaultSelected) - increment
          if (parseInt(defaultSelected)-increment < 0) {
              start = 0
          }
          if (end > parseInt(props.data.length - 1)) {
              end = parseInt(props.data.length - 1)
          }
          console.log("start", start, " end:", end, " last index:", props.data.length-1)
          newdata = props.data.slice(start,end)
          console.log("newdata: ", newdata)
        }
        else {
          newdata = jsondata
        }



        const schema = schemaTop;
        let fusionTable = new FusionCharts.DataStore().createDataTable(
          newdata,
          schema
        );
        let timeseriesDs = Object.assign({}, vizProperties);
        timeseriesDs.dataSource = dataSource
        
        timeseriesDs.dataSource.caption.text = `${props.coin} Price`
        timeseriesDs.dataSource.data = fusionTable;
            
        setState({
          timeSeriesList: [timeseriesDs]
        });   
      }

      fillAnomalyList();
      onFetchData();
    }, [props.anomalies, selected]); //added props.all_data.anomalies to dependency array

    useEffect(() => {
      console.log("item selected:", selected)      
    }, [selected])
    


  
    // refactor the below have variable do all the mapping
    // the final statements only for rendering
    console.log(state.timeSeriesList)
    let fincomponent 
    if(state.timeSeriesList.length > 0){
      fincomponent = state.timeSeriesList.map(elem => 
          <div>
            <ReactFC {...elem} />
          </div>
      );
    }

    else{
      console.log("i am not sending data")
      fincomponent = (
          <div> 
            hello       
          </div>
      )
    }
    
    return (
    <div> 
      <div style={{fontSize:'1.5em', position:'absolute',right:'1.5em'}}>
      Anomaly Dates/Times ({props.priceParam}% price increase, {props.volumeParam}% volume increase): &nbsp;
      <select onChange={e => setSelected(e.currentTarget.value)} >
        {/* {console.log("items:", items)} */}
        {items && items.map(item => (
          <option key={item.value} value={item.value} > 
            {item.label}
          </option>
        ))}
      </select>
      </div>

      {fincomponent}
    </div>
    )

    
}

export default PdVisuals
