import React, { useEffect,useState } from 'react'
import {Modal, Button, Row} from 'react-bootstrap'
// import './modal.module.css';
import axios from 'axios'

function WashingPriceDistributionVisuals(props) {
    const [coinImagePath, setCoinImagePath] = useState("")
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);  
    useEffect(() => {
        async function onStartup(){
            let x = await axios.get(`http://127.0.0.1:5000/plot.png`)
            let x2 = await Promise.resolve(x)
            setCoinImagePath(x2)
        }
        onStartup()
    }, [])

    return (
        <>
        <Button variant="info" onClick={handleShow}  style={{fontSize:'1.5em', position:'absolute', left:'16px', top:'20em', height:'9em', whiteSpace:'pre-wrap', width:'10em'}}>
            Click to learn how to interpret the graph
        </Button>
        <div>
        <Modal style={{opacity:1}} show={show} onHide={handleClose} >
                <Modal.Header closeButton>
                <Modal.Title style={{fontSize:'2em'}}> Graph Interpretation </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{fontSize:'1.3em'}}>
                    {/* Placeholder: Put down stats in this area */}
                    Insert image and information about how to interpret the graph
                    <img style={{maxWidth:'100%', maxHeight:'100%'}} src='./exampleDistribution.png'></img>
                </Modal.Body>
        </Modal>
        </div>
        <div>
            <img src="http://127.0.0.1:5000/plot.png"></img>
        </div>
        </>
    )
}

export default WashingPriceDistributionVisuals
