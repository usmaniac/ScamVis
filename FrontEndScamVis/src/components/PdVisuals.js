import React, { useState, useEffect, Component } from 'react'
import FusionCharts from "fusioncharts";
import TimeSeries from "fusioncharts/fusioncharts.timeseries";
import ReactFC from "react-fusioncharts";

// Data tests
import jsondata from '../usmanTempData.json'
import { Accordion, Card, Button } from 'react-bootstrap';




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

    console.log("anomalies:", props.anomalies)
    console.log("dates:", props.dates )
   
    const [state, setState] = useState({
        timeSeriesList: [], 
    })
   
 
    const [items, setItems] = useState(
      [{
        label: "no results found for given parameters showing default view",
        value: "2nd Jan 2019"
      }],
    );
    const[selected, setSelected] = useState("")
    const[style, setStyle] = useState("Candlestick")

    useEffect(() => {
      console.log("style is:", style)
    }, [style])
    
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
          let from = props.dates[0]
          let to = props.dates[1]
          let all_dates_in_range = props.anomalies.filter(val => {
            return new Date(val[0]) >= from && new Date(val[0]) <= to
          })
          console.log("all dates in range:", all_dates_in_range)
          setItems(
            all_dates_in_range.map((response ) => ({ label: response[0], value: response[1] })),
          );

        } else {
          console.log("props.anomalies is empty using default values")
        }
      }

      function onFetchData() {
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
        else if(props.anomalies && props.anomalies.length > 0){ //default values
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
        else { //if backend completely down use the backup dataset
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

        // Add in style features here 
        if(style === 'Line') {
          timeseriesDs.dataSource.yaxis[0]['plot'] = [{value:'Close', type:"smooth-line"}]
        } else{
          console.log("the plot is:", timeseriesDs.dataSource.yaxis[0]['plot'])
          timeseriesDs.dataSource.yaxis[0]['plot'] = [
            {
              value: {
                open: "Open",
                high: "High",
                low: "Low",
                close: "Close"
              },
              type: "candlestick"
            }
          ]
        }

            
        setState({
          timeSeriesList: [timeseriesDs]
        });   
      }

      fillAnomalyList();
      onFetchData();
    }, [props.anomalies, selected, style]); //added props.all_data.anomalies to dependency array

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
      
      <div style={{fontSize:'1.5em', marginLeft:'70em', paddingLeft:'4.5em', paddingRight:'4.5em'}}>
      <Accordion defaultActiveKey="1" style={{float:'left', width:'70%'}}>
      <Card>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey="0" style={{fontSize:'0.9em'}}>
            Click to see current paramaters
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey="0">
          <Card.Body style={{fontSize:'0.8em'}}>
            <div>Coin: {props.coin} </div>
            <div>Date Range: From {props.dates[0].toString()} to {props.dates[1].toString()}</div>
            <div>Price Increase: {props.priceParam}%</div>
            <div>Volume Increase: {props.volumeParam}%</div>
            <div> Interval: {props.interval} minutes </div>
          </Card.Body>
        </Accordion.Collapse>
       </Card>
      </Accordion>

      <div style={{float:'left', fontSize:'0.95em', width:'30%', height:'100%', padding:'.75rem 1.15rem'}} >
        <select className="browser-default custom-select" style={{fontSize:'0.95em'}} onChange={e => setStyle(e.currentTarget.value)}>
          <option value="Candlestick">Select style </option>
          <option value="Candlestick">Candlestick</option>
          <option value="Line">Line</option>
        </select>
      </div>



      <div style={{float:'left'}}>
      Anomaly List: 
        <select className="browser-default custom-select" onChange={e => setSelected(e.currentTarget.value)} style={{fontSize:'0.95em', width:'75%', marginBottom:'1px'}}>
          {/* {console.log("items:", items)} */}
          {items && items.map(item => (
            <option key={item.value} value={item.value} > 
              {item.label}
            </option>
          ))}
        </select>
      </div>

      </div>
    
      {fincomponent}
    </div>
    
    )

    
}

export default PdVisuals
