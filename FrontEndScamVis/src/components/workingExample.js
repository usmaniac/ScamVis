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


const jsonify = res => res.json();

// left in for future calls
const dataFetch = fetch(
  "https://s3.eu-central-1.amazonaws.com/fusion.store/ft/data/stock-chart-with-volume_data.json"
).then(jsonify);
const schemaFetch = fetch(
  "https://s3.eu-central-1.amazonaws.com/fusion.store/ft/schema/stock-chart-with-volume_schema.json"
).then(jsonify);

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



function PdVisuals() {

    // const [state, setState] = useState({
    //     timeseriesDs: {
    //         type: "timeseries",
    //         renderAt: "container",
    //         width: "600",
    //         height: "400",
    //         dataSource
    //     }
    // })
    const [state, setState] = useState({
        timeSeriesList: [],
    })
    
    const vizProperties = {
      type: "timeseries",
      renderAt: "container",
      width: "600",
      height: "400",
      dataSource : {}
    }
    
    useEffect(() => {
      onFetchData()
    },[]);


    function onFetchData() {

      // Need to store everything in list and then add to state array, since react re-renders
      let finlist = []
      const schema = schemaTop;
      // let data = jsondata;
      let fusionTable = new FusionCharts.DataStore().createDataTable(
        jsondata,
        schema
      );
      let timeseriesDs = Object.assign({}, vizProperties);
      timeseriesDs.dataSource = dataSource
      timeseriesDs.dataSource.data = fusionTable;
      finlist.push(timeseriesDs)

      // part 2 #issue is within the data storage step NOT visualisaton
      console.log("adding new shit")
      let fusionTablex = new FusionCharts.DataStore().createDataTable(
        tempdata,
        schema
      );

      let timeseriesDsx = Object.assign({}, vizProperties);
      timeseriesDsx.dataSource = Object.assign({},dataSource) //(make a copy to get a unique id)
      timeseriesDsx.dataSource.data = fusionTablex;

      finlist.push(timeseriesDsx)
      
    
      setState({
        timeSeriesList: [...state.timeSeriesList, ...finlist]
      });   
    }


  
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
    
    return <div> {fincomponent}</div>

    
}

export default PdVisuals
