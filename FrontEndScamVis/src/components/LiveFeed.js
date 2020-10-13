import React, { useState, useEffect, Component, useRef } from 'react'
import FusionCharts from "fusioncharts";
import TimeSeries from "fusioncharts/fusioncharts.timeseries";
import ReactFC from "react-fusioncharts";
import axios from 'axios'
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


let dataSource = {
  caption: {
    text: "QSP/BTC Price"
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

const vizProperties = {
  type: "timeseries",
  renderAt: "container",
  width: "100%",
  height: "700",
  dataSource : {}
}


const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function LiveFeed(props) {
  const [intervalTime, setIntervalTime] = useState(8000);  // don't forget about default i.e starting wait time
  const[value, setValue] = useState(0)
  const[api_data, set_api_data] = useState({
    data: [],
    p_thresh_ra: 0,
    v_thresh_ra: 0,
    pump_or_not: false
  })


  useEffect(() => {
    console.log("data returned to us is:", props.results)
  }, [props.results])

  

  const [state_timeseries, setState_timeseries] = useState({
      timeSeriesList: [], 
  })
  const [monitoringInfo, setMonitoringInfo] = useState() // this is for the dashboard
  useInterval(() => {
    // Do some API call here ie in setTimeout
    console.log("interval time is(if null we are on pause):", intervalTime)
    setValue(value+1)
    // setTimeout(() => {
    //   // console.log('API call');
    //   console.log(value)
    // }, 500); // after 500ms carry out the function
    async function doRequests() {
      let x = await axios.get('http://127.0.0.1:5000/live_feed?p_thresh=1.3&v_thresh=2&coin=QSP-BTC&interval=1')
      let x2 = await Promise.resolve(x)
      console.log(x2)
      console.log(value)
      set_api_data({
        data: x2.data.visualisation_data,
        p_thresh_ra: x2.data.current_price_ra,
        v_thresh_ra: x2.data.current_volume_ra,
        pump_or_not: x2.data.pump_or_not
      })
    }
    doRequests()
  }, intervalTime);

  useEffect(() => {
    async function onFetchData() {
      let timeseriesDs
      let fusionTable = new FusionCharts.DataStore().createDataTable(api_data.data,schemaTop);
      timeseriesDs = Object.assign({}, vizProperties);
      timeseriesDs.dataSource = dataSource

      timeseriesDs.dataSource.caption.text = `${props.coin} Price`
      timeseriesDs.dataSource.data = fusionTable;
      timeseriesDs.dataSource.yaxis[0]['plot'] = 
      [
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

      setState_timeseries({
        timeSeriesList: [timeseriesDs]
      });   
    }

    onFetchData();
  }, [api_data]); 

  let fincomponent 
  if(state_timeseries.timeSeriesList.length > 0){
    fincomponent = state_timeseries.timeSeriesList.map(elem => 
        <div>
          <ReactFC {...elem} />
        </div>
    );
  }

  else {
    console.log("i am not sending data")
    fincomponent = (
        <div> 
          Live data stream not set up yet       
        </div>
    )
  } 


  return (
    <React.Fragment>
      <div className="App">
        <button onClick={() => setIntervalTime(8000)}>Set interval to 5 seconds</button>
        <button onClick={() => setIntervalTime(null)}>Stop interval live data feed </button>
      </div>
        {/* <div class="box" style={{fontSize:'1.5em', marginLeft:'70em', paddingLeft:'4.5em', paddingRight:'4.5em'}}> */}
          <Card>
            <Card.Header>
            </Card.Header>
              <Card.Body >
                <div>Coin:{props.coin} </div>
                <div>Current price: </div>
                <div>Current Volume: </div>
                <div>Price Increase compared to RA:</div>
                <div>Volume Increase compared to RA: </div>
                <div> Interval: __ minutes </div>
                <div> Pump Status: </div>
              </Card.Body>
          </Card>
        <div>
          {fincomponent}
        </div>
    </React.Fragment>
  );
}

export default LiveFeed