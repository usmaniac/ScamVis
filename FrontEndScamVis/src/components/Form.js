import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useForm } from "react-hook-form";
import Select from 'react-select';
import {  Row, Col, Container, } from 'react-bootstrap';
import PdVisuals from './PdVisuals';
import {Modal, Button} from 'react-bootstrap'
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';




const coins = require('./coins').arr;


function Form() {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [dateValueArray, onChangeDate] = useState([new Date(2019, 0, 1), new Date()]);


    const [state, setState] = useState({
        coin:"DENT-BTC",
        data: [],
        anomalies: [],
        priceParam:'30',
        volumeParam: '400',
        interval: '15'  
    })
    
    const handleChange = selectedoption => {
        console.log("change detected")
        setState({coin: selectedoption.label,
        data: []})
    }

    // Runs for changes in 'state'
    useEffect(() => console.log(state), [state]);  // to print out the state
    useEffect(() => console.log("date values is:", dateValueArray), [dateValueArray]);

    // Run once on startup, ie empty dependency array
    useEffect(() => {
        // 30% -> 1.3
        async function onStartup(){
        let percentage = state.priceParam
        let newPriceThresh = percentage/100 + 1

        let newVolume = (state.volumeParam)/100

        let x = await axios.get(`http://127.0.0.1:5000/anomalies?p_thresh=${newPriceThresh}&v_thresh=${newVolume}&coin=${state.coin}&interval=15`)
        let x2 = await Promise.resolve(x)

        console.log("x2:",x2)
        console.log("x2.data:", x2.data)

        setState({ coin:state.coin, data:JSON.parse(x2.data.data), anomalies:x2.data.anomalies, 
            priceParam:percentage, volumeParam: state.volumeParam, interval: state.interval  })
        }
        onStartup()
    }, [])



    const {register, handleSubmit, errors} = useForm();
    async function onSubmit(data) {
        // send data away to api
        console.log("data from react-hook-form:", data)
        console.log("coin is:",state.coin)

        // converting percentage ie 10% to 1.1
        let percentage = data.Price
        let newPriceThresh = percentage/100 + 1
        let newVolume = (data.Volume)/100
        console.log("newPrice is:", newPriceThresh)

        let x = await axios.get(`http://127.0.0.1:5000/anomalies?p_thresh=${newPriceThresh}&v_thresh=${newVolume}&coin=${state.coin}&interval=${data.interval}`)
        let x2 = await Promise.resolve(x)

        console.log("x2:",x2)
        console.log("x2.data:", x2.data)

        setState({ coin:state.coin, data:JSON.parse(x2.data.data), anomalies:x2.data.anomalies, 
            priceParam:percentage, volumeParam: data.Volume, interval: data.interval })  
        
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
                    <Select  ref={register} options={coins} onChange={handleChange} name="Coin"/>
                    </div>
                </Row>

                <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial'}}>
                    <label style={{fontSize:'1.3em'}} > Date/Time Range: {' '} </label>
                    <DateTimeRangePicker
                        onChange={onChangeDate}
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
                <label style={{fontSize:'1.3em'}}> Time interval:  </label>
                <div></div>
                <select name="interval" id="intervals" style={{fontSize:'1.5em'}} ref={register({required: true})}>
                    <option value="5">5 min</option>
                    <option value="10">10 min</option>
                    <option value="15" selected>15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 hr</option>
                </select>
                </Row>
                
                            
                {errors.Price && <p>{errors.Price.message}</p>}
                {errors.Volume && <p>{errors.Volume.message}</p>}



                <input style={{marginTop:'2em', fontSize:'1.5em'}} type="submit" onClick={handleClose}/>
            </form>



            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>
        
    
        <PdVisuals anomalies={state.anomalies} data={state.data} coin={state.coin} 
        priceParam={state.priceParam} volumeParam={state.volumeParam} dates={dateValueArray} interval={state.interval}></PdVisuals>
    </>
    )
}

export default Form
