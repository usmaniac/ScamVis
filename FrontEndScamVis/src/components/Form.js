import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useForm } from "react-hook-form";
import Select from 'react-select';
import {  Row, Col, Container, } from 'react-bootstrap';
import PdVisuals from './PdVisuals';
import {Modal, Button} from 'react-bootstrap'
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import LiveFeed from './LiveFeed';




const coins = require('./coins').arr;


function Form() {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [dateValueArray, onChangeDate] = useState([new Date(2019, 0, 1), new Date()]);


    const [state, setState] = useState({
        coin:"DENT-BTC",
        results: [],
        priceParam:'30',
        volumeParam: '400',
        live_or_historical: 'historical',
        interval: '15'  
    })
    
    useEffect(() => {
        console.log(state)
    }, [state])

    // Runs for changes in 'state'
    useEffect(() => console.log("form js state is:", state), [state]);  // to print out the state
    useEffect(() => console.log("date values is:", dateValueArray), [dateValueArray]);

    // Run once on startup, ie empty dependency array, this is the default view when API is running
    useEffect(() => {
        // 30% -> 1.3
        async function onStartup(){
        let percentage = state.priceParam
        let newPriceThresh = percentage/100 + 1

        let newVolume = (state.volumeParam)/100
        let x = await axios.get(`http://127.0.0.1:5000/anomalies?p_thresh=${newPriceThresh}&v_thresh=${newVolume}&coin=${state.coin}&interval=15&win_size=120`)
        let x2 = await Promise.resolve(x)
        setState({ coin:state.coin, results:x2.data.results, 
            priceParam:percentage, volumeParam: state.volumeParam, live_or_historical: 'historical', interval: state.interval  })
        }
        onStartup()
    }, [])

    // This is the view that occurs after you press the submit button on the form 
    const {register, handleSubmit, errors} = useForm();
    async function onSubmit(data) {
        console.log("data object returned from the form is: ", data)
        let percentage = data.Price
        let newPriceThresh = percentage/100 + 1
        let newVolume = (data.Volume)/100

        if(data.live_or_historical == "live"){
            // different api called continually/ need to replace this one
            let x = await axios.get(`http://127.0.0.1:5000/anomalies?p_thresh=${newPriceThresh}&v_thresh=${newVolume}&coin=${state.coin}&interval=${data.interval}&win_size=${data.win_size}`)
            let x2 = await Promise.resolve(x)
            setState({ coin:state.coin, results:x2.data.results, 
                priceParam:percentage, volumeParam: data.Volume, live_or_historical:data.live_or_historical, interval: data.interval }) 
        }
        
        else {
        let x = await axios.get(`http://127.0.0.1:5000/anomalies?p_thresh=${newPriceThresh}&v_thresh=${newVolume}&coin=${state.coin}&interval=${data.interval}&win_size=${data.win_size}`)
        let x2 = await Promise.resolve(x)
        setState({ coin:state.coin, results:x2.data.results, 
            priceParam:percentage, volumeParam: data.Volume, live_or_historical:data.live_or_historical, interval: data.interval })  
        }
        
    } 
    
    return (
        <>
        <Button variant="primary" onClick={handleShow}  style={{float:'left',marginLeft:'12em', fontSize:'1.5em'}}>
            Modify Coin and Anomaly Parameters
        </Button>
        
            <Modal style={{opacity:1}} show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title> Coin and anomaly parameters  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial'}}>
                        <label style={{fontSize:'1.3em'}} > Coin: </label>
                        <div style={{fontSize:'1.5em'}}>
                        <Select  ref={register} options={coins} name="Coin"/>
                        </div>
                    </Row>

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial'}}>
                        <label style={{fontSize:'1.3em'}} > Date/Time Range: {' '} </label>
                        <DateTimeRangePicker
                            // onChange={onChangeDate}
                            value={dateValueArray}
                            minDate={new Date(2019, 0, 1)}
                            maxDate={new Date()}
                        />
                    </Row>

                    
                    <Row style={{display:'initial'}}>
                    <label style={{fontSize:'1.3em'}} > Price Increase (%): </label>
                    <br/>
                    <input style ={{fontSize:'1.5em'}} type="text" placeholder="Price" name="Price" ref={register({required: true, pattern: {value:/^[0-9.]*$/ ,message: "Price must be a numeric value"}})}/>
                    </Row>
                

                    <Row style={{display:'initial'}}>
                    <label style={{fontSize:'1.3em'}}> Volume Increase (%): </label>
                    <br/>
                    <input  style ={{fontSize:'1.5em'}} type="text" placeholder="Volume" name="Volume" ref={register({required: true, pattern: {value:/^[0-9.]*$/ ,message: "Volume must be a numeric value"}})}/>
                    </Row>

                    <Row style={{display:'initial'}} >
                    <label style={{fontSize:'1.3em'}}> Time Interval:  </label>
                    <div></div>
                    <select name="interval" id="intervals" style={{fontSize:'1.5em'}} ref={register({required: true})}>
                        <option value="1">1 min</option>
                        <option value="5">5 min</option>
                        <option value="10">10 min</option>
                        <option value="15" selected>15 min</option>
                        <option value="30">30 min</option>
                        <option value="60">1 hr</option>
                    </select>
                    </Row>

                    <Row style={{display:'initial'}} >
                    <label style={{fontSize:'1.3em'}}> Historical Mode vs Live Mode:  </label>
                    <div></div>
                    <select name="live_or_historical" id="live_or_historical" style={{fontSize:'1.5em'}} ref={register({required: true})}>
                        <option value="historical" selected> historical </option>
                        <option value="live"> live </option>
                    </select>
                    </Row>


                    <Row style={{display:'initial'}} >
                    <label style={{fontSize:'1.3em'}}> Window Size:  </label>
                    <div></div>
                    <select name="win_size" id="win_size" style={{fontSize:'1.5em'}} ref={register({required: true})}>
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="60">1 hour</option>
                        <option value="120" selected>2 hours</option>
                        <option value="240">4 hours</option>
                        <option value="480">8 hours</option>
                        <option value="1440">1 day</option>
                    </select>
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
        
        {/* render only on live mode*/}
        { state.live_or_historical == "historical" ? (
            <PdVisuals key={state.results} results={state.results} coin={state.coin}
            priceParam={state.priceParam} volumeParam={state.volumeParam} dates={dateValueArray} interval={state.interval}></PdVisuals>
        ) : (
            <LiveFeed coin={state.coin} priceParam={state.priceParam} volumeParam={state.volumeParam}></LiveFeed> //new component without the anomaly list
        )
        }
        
    </>
    )
}

export default Form
