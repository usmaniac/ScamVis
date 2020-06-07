import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useForm } from "react-hook-form";
import Select from 'react-select';
import DateRangePicker from './DateRangePicker';
import {  Row, Col, Container, } from 'react-bootstrap';
import PdVisuals from './PdVisuals';
import {Modal, Button} from 'react-bootstrap'



const coins = require('./coins').arr;


function Form() {

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [state, setState] = useState({
        coin:"DENT-BTC",
        data: [],
        anomalies: []
    })
    
    const handleChange = selectedoption => {
        console.log("change detected")
        setState({coin: selectedoption.label,
        data: []})
    }

    
    useEffect(() => console.log(state), [state]);  // to print out the state


    const {register, handleSubmit, errors} = useForm();
    async function onSubmit(data) {
        // send data away to api
        console.log(data)
        console.log("coin is:",state.coin)

        // converting percentage ie 10% to 1.1
        let percentage = data.Price
        let newPriceThresh = percentage/100 + 1
        console.log("newPrice is:", newPriceThresh)

        let x = await axios.get(`http://127.0.0.1:5000/anomalies?p_thresh=${newPriceThresh}&v_thresh=${data.Volume}&coin=${state.coin}`)
        let x2 = await Promise.resolve(x)

        console.log("x2:",x2)
        console.log("x2.data:", x2.data)
        // JSON.parse(JSON.stringify(userData))
        // x2.data is an object
        // x2.data.data is a json string not an object
        setState({ coin:state.coin, data:JSON.parse(x2.data.data), anomalies:x2.data.anomalies })  // not setting the data, setstate is async
        
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
                
                {/* <Row style={{paddingLeft:'2em', paddingRight:'2em'}} >
                    <label> Date Range: </label>
                    <DateRangePicker />
                </Row> */}
                
                <Row style={{display:'initial'}}>
                <label style={{fontSize:'1.3em'}} > Price Increase (%): </label>
                <br/>
                <input style ={{fontSize:'1.5em'}} type="text" placeholder="Price" name="Price" ref={register({required: true, pattern: {value:/^[0-9.]*$/ ,message: "Price must be a numeric value"}})}/>
                </Row>
            

                <Row style={{display:'initial'}}>
                <label style={{fontSize:'1.3em'}}> Volume Increase:  </label>
                <br/>
                <input  style ={{fontSize:'1.5em'}} type="text" placeholder="Volume" name="Volume" ref={register({required: true, pattern: {value:/^[0-9.]*$/ ,message: "Volume must be a numeric value"}})}/>
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







        
    
        {/* <PdVisuals anomalies={state.anomalies} data={state.data} coin={state.coin}></PdVisuals> */}
    </>
    )
}

export default Form
