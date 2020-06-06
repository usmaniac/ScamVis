import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Title from './components/Title'
import PdVisuals from './components/PdVisuals';
import Form from './components/Form'
import {  Row, Col, Container, } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';



function App() {


  return (
    <div className="App">
      <Title/>
      <Form/>
    </div>
  );
}

export default App;
