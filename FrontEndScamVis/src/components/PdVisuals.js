import React, { useState, useEffect, Component } from 'react'
import FusionCharts from "fusioncharts";
import TimeSeries from "fusioncharts/fusioncharts.timeseries";
import ReactFC from "react-fusioncharts";

// Data tests
import usmanTempData from '../usmanTempData.json'
import one_mindata from '../1mindata.json'
import thirty_min_data from '../30mindata.json'
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
      title: "Stock Price (BTC)"
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

    useEffect(() => {
      console.log("data returned to us is:", props.results)
    }, [props.results])

    const [state, setState] = useState({
        timeSeriesList: [], 
    })
 
    // list of items in the drop down list at the
    const [items, setItems] = useState(
      [{
        label: "no results found for given parameters showing default view",
        value: []
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
        if(props.results && props.results.length > 0){
          setItems(
            props.results.map((response ) => ({ label: response['anomaly_date'], value: response['ohlc_data'] })),
          );

        } else {
          console.log("props.anomalies is empty using default values")
        }
      }

      async function onFetchData() {
        let fusionTable
        if (selected) {
          console.log("selected is:", selected)
          console.log("type of selected is:",typeof selected ) // A string not 2d array
          let i
          for(i=0; i<items.length; i++){
            if(items[i].label == selected){
              console.log("rendering data: ", items[i].value)
              fusionTable = new FusionCharts.DataStore().createDataTable(items[i].value, schemaTop);
              break;
            }
          }
          console.log("newdata is: ", items[i].value)
        }
        else if(props.results && props.results.length > 0){ //default values
          fusionTable = new FusionCharts.DataStore().createDataTable(props.results[0]['ohlc_data'],schemaTop);
        }
        else { //if backend completely down use the backup dataset
          fusionTable = new FusionCharts.DataStore().createDataTable(usmanTempData,schemaTop);
          // whatever is rendered here for interval, will persist to all other visualisation intervals
          // console.log("our data is:", usmanTempData)
        }

        let timeseriesDs = Object.assign({}, vizProperties);
        timeseriesDs.dataSource = dataSource
        
        timeseriesDs.dataSource.caption.text = `${props.coin} Price`
        timeseriesDs.dataSource.data = fusionTable;

        // Add in style features here 
        if(style === 'Line') {
          timeseriesDs.dataSource.yaxis[0]['plot'] = [{value:'Close', type:"smooth-line"}]
        } else{
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
    }, [props.results, selected, style, props.interval]); //added props.all_data.results to dependency array
    
    let fincomponent 
    if(state.timeSeriesList.length > 0){
      fincomponent = state.timeSeriesList.map(elem => 
          <div>
            <ReactFC {...elem} />
          </div>
      );
    }

    else {
      console.log("i am not sending data")
      fincomponent = (
          <div> 
            hello       
          </div>
      )
    }
    
    return (
    <div> 
      
      <div class="box" style={{fontSize:'1.5em', marginLeft:'70em', paddingLeft:'4.5em', paddingRight:'4.5em'}}>
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
              <div>Date Range: From {props.dates[0].toString().replace("Australian Eastern Daylight Time", "AEDT")} to {props.dates[1].toString().replace("Australian Eastern Standard Time", "AEST")}</div>
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
        
        <div style={{float:'left', width:'40%'}}> Anomaly List: </div>

        <select className="browser-default custom-select" onChange={  e => setSelected(e.currentTarget.value) } style={{float:'left', width:'60%', fontSize:'0.95em', marginBottom:'1px'}}>
          {items && items.map(item => (
            // console.log("item value", item.value),
            <option key={item.label} value={item.label} > 
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
