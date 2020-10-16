import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Title from './components/Title'
import PdVisuals from './components/PdVisuals';
import Form from './components/Form'
import {  Row, Col, Container, } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  const [currentScam, setCurrentScam] = useState("pump_and_dump")

  useEffect(() => {
    console.log("current scam", currentScam)
  }, [currentScam])

  let element_to_render
  if(currentScam=='pump_and_dump'){
    element_to_render = <Form/>
  } else {
    element_to_render = <div> To do: {currentScam}</div>
  }
  
  async function handleRadioChangeValue(event){
    console.log("scam is: ", event.currentTarget.value)
    let value = event.currentTarget.value
    if(value === "spoofing"){
       setCurrentScam("spoofing")
    }
    else if(value === "wash_trading"){
      setCurrentScam("wash_trading")
    } 
    else {
      setCurrentScam("pump_and_dump")
    }
  }

  return (

    <div className="App">
      <Title/>
      <div style={{position:'absolute', top:'40px', right:'40px', fontSize:'1.5rem'}}>
        <b>Scam Select:&nbsp;</b>
        <input onChange={handleRadioChangeValue} type="radio" value="pump_and_dump" name="scam" style={{display:'inline'}} defaultChecked/> Pump and Dump &nbsp;
        <input onChange={handleRadioChangeValue} type="radio" value="wash_trading" name="scam" style={{display:'inline'}}/> Wash Trading &nbsp;
        <input onChange={handleRadioChangeValue} type="radio" value="spoofing" name="scam" style={{display:'inline'}} /> Spoofing
      </div>
      {element_to_render}
    </div>
  );
}

export default App;
