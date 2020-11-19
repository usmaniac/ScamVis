import React, { useState, useEffect}  from 'react';
import Plot from 'react-plotly.js';
import {Modal, Button, Row} from 'react-bootstrap'


//  python  -> import plotly.graph_objs as go


function WashingVisuals(props) {

    // python: fig = dict(data=data, layout=layout)
    // x is an array
    // y is an array
    useEffect(() => {
        // console.log("set state approrpiately for the danger state")
        // // gets called whenever props change
        // setDangerState(props.dangerState)
        console.log("props results are:", props.results)
        console.log("stats received are: ", props.results['stats'])
        if(parseInt(props.results['stats']['In-spread Volume, %']) > 50){
            setDangerState("danger")
        } 
        else {
            setDangerState("success")
        }
    }, [props])

    // Depending on props the modal color and text will change
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);  
    const [dangerState, setDangerState] = useState("danger")
    // const [modalText, setModalText] = useState("High Levels of wash trading, click to see stats")
    let textToRender
    let modalDanger
    if(dangerState== "danger"){
        textToRender  = ["High Levels of Wash Trading Detected!",
        <br/>,
        "Click to see stats"]
        modalDanger = "dangerous"

    }
    else{
        textToRender = ["Negligible Levels of Wash Trading Detected",
        <br/>,
        "Click to see stats"]
        modalDanger = "negligible"
    }

    let trace0 = {
        x: props.results['market_buy_x_values'],
        y: props.results['market_buy_y_values'],
        name: 'Market BUY',
        mode: 'markers',
        marker: {
            size:10,
            color:'#3F4B7F',
            symbol:'triangle-up',
            line: {
                width: 0,
                color: '#3F4B7F'
            }
        }
    }

    let trace1 = {
        x: props.results['market_sell_x_values'],
        y: props.results['market_sell_y_values'],
        name: 'Market SELL',
        mode: 'markers',
        marker: {
            size: 10,
            color: 'rgb(76, 182, 170)',
            symbol: 'triangle-down',
            line: {
                width: 0,
                color:'#3F4B7F'
            }
        }
    }



    let trace2 = {
        x: props.results['best_bid_x_values'],
        y: props.results['best_bid_y_values'],
        name: 'Best BID',
        mode: 'lines',
        marker: {
            size: 5,
            color: '#737CB4',
            symbol: 'line-ew',
            opacity: 1,
            line: {
                width: 1,
                color: '#737CB4'
            }
        },
        line: {
            shape: 'hv',
        }
    }

    let trace3 = {
        x: props.results['best_ask_x_values'],
        y: props.results['best_ask_y_values'],
        name: 'Best ASK',
        mode: 'lines',
        marker: {
            size: 5,
            color: '#6AD2C5',
            symbol: 'line-ew',
            opacity: 1,
            line: {
                width: 1,
                color: '#6AD2C5'
            }
        },
        line: {
            shape: 'hv',
        }
    }

    let binanceTradeTrace = {
        x: props.results['binance_trades_x_values'],
        y: props.results['binance_trades_y_values'],
        name: 'Binance Trade (side not provided)',
        mode: 'markers',
        marker: {
            size: 10,
            color: 'rgb(299, 199, 188)',
            symbol: 'x',
            line: {
                width: 0,
                color:'#3F4B7F'
            }
        }
    }

    let data;
    
    if (props.results['binance_trades_x_values'].length > 0) {
        console.log("printing binance results")
        data = [trace2, trace3, binanceTradeTrace]
    }
    else{
        console.log("printing non-binance results")
        data = [trace2, trace3, trace0, trace1]
    }
    
    let layout = { 
        title: `Wash Trading Analysis: ${props.coin} at ${props.exchange} `,
        yaxis: {
            zeroline:true
        },
        xaxis: {
            zeroline: false
        },
        width: 1200, 
        height: 700
    }

    return (
        <>
        <Button variant={dangerState} onClick={handleShow}  style={{fontSize:'1.5em', position:'absolute', left:'16px', top:'20em', height:'9em', whiteSpace:'pre-wrap', width:'10em'}}>
            {textToRender}
        </Button>
        <Modal style={{opacity:1}} show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title style={{fontSize:'2em'}}> Wash Trading Statistics </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Placeholder: Put down stats in this area */}

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial', fontSize:'2em' }}>
                        <b>In-spread trades: </b>{props.results['stats']['In-spread Trades']}
                    </Row>

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial', fontSize:'2em'}}>
                        <b>In-spread volume:</b> {props.results['stats']['In-spread Volume']}
                    </Row>
                    
                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial', fontSize:'2em'}}>
                        <b>In-spread volume (%):</b> {props.results['stats']['In-spread Volume, %']}
                    </Row>

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial', fontSize:'2em'}}>
                        <b>Total Volume:</b> {props.results['stats']['Total Volume']}
                    </Row>

                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial', fontSize:'2em'}}>
                        <b>Total Trades:</b> {props.results['stats']['Trades Total']}
                    </Row>
                    
                    
                    <Row style={{paddingLeft:'2em', paddingRight:'2em', display:'initial', fontSize:'2em'}}> 
                    <b>Final Analysis:</b> You should aim to have a 0% in-spread trade percentage. The coin pair <b>{props.coin}</b> at exchange <b> {props.exchange} </b> represents <b>{modalDanger}</b> levels
                    of wash trading </Row>

                </Modal.Body>
        </Modal>

        <Plot
        data={data}
        layout={layout}
        />
        </>
    )

}

export default WashingVisuals
