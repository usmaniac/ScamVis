import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useForm } from "react-hook-form";
import Select from 'react-select';
import {  Row, Col, Container, } from 'react-bootstrap';
import {Modal, Button} from 'react-bootstrap'
import ReactTooltip from "react-tooltip";
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import WashingVisuals from './WashingVisuals'
import WashingPriceDistributionVisuals from './WashingPriceDistributionVisuals';

const BWwashCoins = require('./BWwashCoins').arr;
const BinanceWashCoins = require('./binanceWashCoins').arr
const LbankWashCoins = require('./LbankWashCoins').arr

function WashTradingForm() {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);  
    const [formCoin, setFormCoin] = useState('BSV_BTC')
    const {register, handleSubmit, errors} = useForm();
    const [dateValueArray, onChangeDate] = useState([new Date(2019, 0, 1), new Date()]);
    const [isDisabled, setDisabled] = useState(true)
    const [currentExchange, setCurrentExchange] = useState('BW')
    const[results, setResults] = useState({
        best_bid_x_values: [],
        best_bid_y_values: [],
        best_ask_x_values: [],
        best_ask_y_values: [],
        market_buy_x_values: [],
        market_buy_y_values: [],
        market_sell_x_values: [],
        market_sell_y_values: [],
        binance_trades_x_values: [],
        binance_trades_y_values: [],
        symbol: 'BSV_BTC'
    })
    
    const exchangeList = [
        { value: 'BW', label: 'BW' },
        { value: 'Binance', label: 'Binance' },
        { value: 'Lbank', label: 'Lbank' }
    ]

    const exchangeMapping ={
        "BW": BWwashCoins,
        "Binance": BinanceWashCoins,
        "lbank": LbankWashCoins
    }
    
    const [currentVisuals, setCurrentVisuals] = useState('trades_graph')

    useEffect(() => {
        console.log("form coin is: ", formCoin)
    }, [formCoin])
    
    useEffect(() => {
        console.log(currentExchange)
    }, [currentExchange])
    
    // On start up
    useEffect(() => {
        async function onStartUp(){
            let x = await axios.get(`http://127.0.0.1:5000/wash_trading_graphs?coin=${formCoin}&exchange=${currentExchange}`)
            let x2 = await Promise.resolve(x)
            setResults({
                best_bid_x_values: x2.data.best_bid_x_values,
                best_bid_y_values: x2.data.best_bid_y_values,
                best_ask_x_values: x2.data.best_ask_x_values,
                best_ask_y_values: x2.data.best_ask_y_values,
                market_buy_x_values: x2.data.market_buy_x_values,
                market_buy_y_values: x2.data.market_buy_y_values,
                market_sell_x_values: x2.data.market_sell_x_values,
                market_sell_y_values: x2.data.market_sell_y_values,
                binance_trades_x_values: x2.data.binance_trades_x_values,
                binance_trades_y_values: x2.data.binance_trades_y_values,
                symbol: x2.data.symbol
            })
        }
        onStartUp()
    }, []);


    async function onSubmit(data) {
        console.log("data object returned from the form is: ", data)    
        // carry out API calls here and set results state
        // need this to take in the coin that we want
        let x = await axios.get(`http://127.0.0.1:5000/wash_trading_graphs?coin=${formCoin}&exchange=${currentExchange}`)
        let x2 = await Promise.resolve(x)
        setResults({
            best_bid_x_values: x2.data.best_bid_x_values,
            best_bid_y_values: x2.data.best_bid_y_values,
            best_ask_x_values: x2.data.best_ask_x_values,
            best_ask_y_values: x2.data.best_ask_y_values,
            market_buy_x_values: x2.data.market_buy_x_values,
            market_buy_y_values: x2.data.market_buy_y_values,
            market_sell_x_values: x2.data.market_sell_x_values,
            market_sell_y_values: x2.data.market_sell_y_values,
            binance_trades_x_values: x2.data.binance_trades_x_values,
            binance_trades_y_values: x2.data.binance_trades_y_values,
            symbol: x2.data.symbol
        })
    }
    

    async function handleRadioChangeValue(event){
        let value = event.currentTarget.value
        // console.log("value is: ", value)
        if(value === "specifyDateRange"){
            setDisabled(false)
        }
        else{
            setDisabled(true)
        }
    }
    
    async function handleCoinChange(newvalue){
        setFormCoin(newvalue['label'])
    }
    
    async function handleExchangeChange(newvalue){
        if(newvalue['label'] == "Lbank"){
            setCurrentExchange("lbank")
        } else {
            setCurrentExchange(newvalue['label'])
        }
    }

    async function radioVisualsChange(event){
        let value = event.currentTarget.value
        // console.log(value)
        setCurrentVisuals(value)
    }

    let elementToRender
    if(currentVisuals=='trades_graph'){
        elementToRender= <WashingVisuals key={formCoin} exchange={currentExchange} results={results} coin={formCoin} dates={dateValueArray}></WashingVisuals>
    }
    else{
        elementToRender = <WashingPriceDistributionVisuals coin={formCoin}></WashingPriceDistributionVisuals>
    }

    return (
        <>
        <Button variant="primary" onClick={handleShow}  style={{float:'left',marginLeft:'12em', fontSize:'1.5em'}}>
            Set Coin and Anomaly Parameters
        </Button>
        <div style={{position:'absolute', right:'160px', marginBottom:'10px', fontSize:'1.5rem', bottom:'620px'}}>
        <b>Visuals Select:&nbsp;</b>
            <input onChange={radioVisualsChange} type="radio" name="graph_to_show" value="trades_graph" style={{display:'inline'}} defaultChecked/> Trades &nbsp;
            <input onChange={radioVisualsChange} type="radio" name="graph_to_show" value="price_distribution" style={{display:'inline'}} /> Price Distribution &nbsp;
        </div>
            <Modal style={{opacity:1}} show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title> Coin and Anomaly Parameters </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                
                <form onSubmit={handleSubmit(onSubmit)} id="paramaterForm">

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial'}}>
                        <label style={{fontSize:'1.3em'}} > Exchange: </label>
                        <div style={{fontSize:'1.5em'}}>
                            <Select ref={register} options={exchangeList} name="exchanges" onChange={handleExchangeChange}/> 
                        </div>
                    </Row>

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial'}}>
                        <label style={{fontSize:'1.3em'}} > Coin: </label>
                        <div style={{fontSize:'1.5em'}}>
                            <Select ref={register} options={exchangeMapping[currentExchange]} name="Coin" onChange={handleCoinChange}/> 
                        </div>
                    </Row>

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial'}}>
                         <label style={{fontSize:'1.3em'}}> All Anomalies vs Date Range:  </label>
                         <div style= {{fontSize:'1.5rem', paddingBottom:'1.5rem'}}  >
                            <input type="radio" value="selectAll" name="anomaly_select" onChange={handleRadioChangeValue} defaultChecked/> Select All Anomalies
                            <input style={{marginLeft:'2rem'}} type="radio" value="specifyDateRange" onChange={handleRadioChangeValue} name="anomaly_select"/> Specify Date Range
                        </div>
                        <label style={{fontSize:'1.3em'}} > Date/Time Range: {' '} </label>
                        <div style={{fontSize:'2rem'}}>
                            <DateTimeRangePicker 
                                onChange={onChangeDate}
                                value={dateValueArray}
                                minDate={new Date(2020, 9, 19, 19, 45)}
                                maxDate={new Date(2020, 9, 19, 20, 45)}
                                disableClock={true}
                                disableCalendar={true}
                                disabled={isDisabled}
                            />
                            {/* <a data-tip data-for='happyFace'> (I) </a> */}
                            <img src='./info.png' data-tip data-for='happyFace' style={{width:'1.2em', margin:'0.5em'}}></img>
                            <ReactTooltip id='happyFace' >
                                <span>Time is in 24 hour format</span>
                            </ReactTooltip>
                        </div>
                    </Row>
                            
                    {errors.Price && <p>{errors.Price.message}</p>}
                    {errors.Volume && <p>{errors.Volume.message}</p>}

                    <input style={{marginTop:'2em', fontSize:'1.5em'}} type="submit" onClick={handleClose} value="Analyse"/>
                    <Button variant="secondary" onClick={handleClose} style={{marginLeft:'1em', padding:'1px 6px', marginBottom:'0.3em', height:'2em', fontSize:'1.35em'}}>
                        Close
                    </Button>
                </form>
            </Modal.Body>
        </Modal>

        {/* <WashingVisuals key={formCoin} results={results} coin={formCoin} dates={dateValueArray}></WashingVisuals> */}
        {elementToRender}
        </>
    )
}

export default WashTradingForm

