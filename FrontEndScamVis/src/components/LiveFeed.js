import React, { useState, useEffect, Component, useRef } from 'react'
import FusionCharts from "fusioncharts";
import TimeSeries from "fusioncharts/fusioncharts.timeseries";
import ReactFC from "react-fusioncharts";
import axios from 'axios'
import { Accordion, Card, Button } from 'react-bootstrap';
import one_mindata from '../1mindata.json'



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
    theme: "candy",
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
      max: "900000"
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
  const [intervalTime, setIntervalTime] = useState(5000);  // don't forget about default i.e starting wait time
  const[value, setValue] = useState(0)
  
  // const [shade, setshade] = useState('rgba(0, 255, 0, 0.3)')
  // const[borderColour, setBorderColour] = useState('green')

  const[borderStyles, setBorderStyles] = useState({
    backgroundColor:'rgba(0, 255, 0, 0.3)',
    borderColour:'green',
    img_src: './check.png'
  })


  const[api_data, set_api_data] = useState({
    data: [],
    p_thresh_ra: 0,
    v_thresh_ra: 0,
    pump_or_not: String(false)
  })
  const[price_and_vol, set_price_and_vol] = useState({
    c_price:0,
    c_volume:0
  })
  
  const [parameters, setParameters] = useState({
    priceParam: 1.2,
    volumeParam: 2
  })

  useEffect(() => {
    // console.log("data returned to us is:", props.results
    async function onStart(){
    console.log("performing on start function")
    // let x = await axios.get(`http://127.0.0.1:5000/live_feed?p_thresh=${parameters.priceParam}&v_thresh=${parameters.volumeParam}&coin=${props.coin}&interval=1`)
    // let x2 = await Promise.resolve(x)
    // console.log(x2)
    console.log(value)
    set_api_data({
      data: one_mindata,
      p_thresh_ra: 0,
      v_thresh_ra: 0,
      pump_or_not: String(false)
    })
    set_price_and_vol({
      c_price: 0,
      c_volume: 0
    })
    let fusionTable = new FusionCharts.DataStore().createDataTable(one_mindata,schemaTop);
    let timeseriesDs = Object.assign({}, vizProperties);
    timeseriesDs.dataSource = dataSource

    // timeseriesDs.dataSource.caption.text = `${props.coin} Price`
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
    
    if(api_data.pump_or_not == String(true)){
      // setBorderColour('red')
      // setshade('rgba(255, 0, 0, 0.376)')
      setBorderStyles({
        backgroundColor: '#FF000060',
        borderColour: 'red',
        img_src:'./warning.png'
      })
    } else {
      // setBorderColour('')
      // setshade('rgba(0, 255, 0, 0.3)')
      setBorderStyles({
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderColour: 'green',
        img_src:'./check.png'
      })
    }

    }
    onStart()
  }, [])


  const [state_timeseries, setState_timeseries] = useState({
      timeSeriesList: [], 
  })
  useInterval(() => {
    // Do some API call here ie in setTimeout
    console.log("interval time is(if null we are on pause):", intervalTime)
    setValue(value+1)
    async function doRequests() {
      // eventual query: 
      let x = await axios.get(`http://127.0.0.1:5000/live_feed?p_thresh=${parameters.priceParam}&v_thresh=${parameters.volumeParam}&coin=${props.coin}&interval=1`)
      let x2 = await Promise.resolve(x)
      console.log(x2)
      console.log(value)
      set_api_data({
        data: x2.data.visualisation_data,
        p_thresh_ra: x2.data.current_price_ra,
        v_thresh_ra: x2.data.current_volume_ra,
        pump_or_not: String(x2.data.pump_or_not)
      })
      set_price_and_vol({
        c_price: x2.data.visualisation_data[29][2],
        c_volume: x2.data.visualisation_data[29][5]
      })
      let fusionTable = new FusionCharts.DataStore().createDataTable(api_data.data,schemaTop);
      let timeseriesDs = Object.assign({}, vizProperties);
      timeseriesDs.dataSource = dataSource

      // timeseriesDs.dataSource.caption.text = `${props.coin} Price`
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
      
      if(x2.data.pump_or_not == true){
        // setBorderColour('red')
        setBorderStyles({
          backgroundColor: '#FF000060',
          borderColour: 'red',
          img_src:'./warning.png'
        })
      } else {
        // setBorderColour('green')
        setBorderStyles({
          backgroundColor: 'rgba(0, 255, 0, 0.3)',
          borderColour: 'green',
          img_src:'./check.png'
        })
      }

    }
    doRequests()
  }, intervalTime);


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
          Live data stream not detected     
        </div>
    )
  } 


  return (
    <React.Fragment>
      
        {/* <div class="box" style={{fontSize:'1.5em', marginLeft:'70em', paddingLeft:'4.5em', paddingRight:'4.5em'}}> */}
          <Card style={{marginLeft:'80em', width:'55em', marginBottom:'0.5em', border:`solid ${borderStyles.borderColour}`, backgroundColor:`${borderStyles.backgroundColor}`}}>
              <Card.Body >
                <div className="interval_timers">
                  <button onClick={() => setIntervalTime(5000)}>Start live data feed </button>
                  <button onClick={() => setIntervalTime(null)}>Stop interval live data feed </button>
                </div>
                {/* this will change depending on state */}
                <img src={borderStyles.img_src} style={{maxWidth:'60%', maxHeight:'90px', float:'right'}}></img>
                <div className='details' style={{fontSize:'1.5em'}}>
                  <div> <b>Coin:</b>{props.coin} </div>
                  <div> <b>Price Threshold:</b> {props.priceParam}  </div>
                  <div> <b>Volume Threshold:</b> {props.volumeParam} </div>
                  <div> <b>RA Price:</b> {api_data.p_thresh_ra.toExponential(3)}  <b>Current Price (High):</b> {price_and_vol.c_price.toExponential(3)}</div> 
                  <div> <b>RA Volume:</b> {api_data.v_thresh_ra.toExponential(3)} <b> Current Volume:</b> {price_and_vol.c_volume} </div>   
                  <div> <b>Status: </b> {api_data.pump_or_not == "false" ? 'OK': 'Pump Detected'} </div>
                </div>
              </Card.Body>
          </Card>
        <div>
          {fincomponent}
        </div>
    </React.Fragment>
  );
}

export default LiveFeed