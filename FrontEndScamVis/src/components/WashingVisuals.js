import React from 'react';
import Plot from 'react-plotly.js';

//  python  -> import plotly.graph_objs as go


function WashingVisuals(props) {

    // python: fig = dict(data=data, layout=layout)
    // x is an array
    // y is an array
    console.log(props)

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

    let data = [trace2, trace3, trace0, trace1]
    
    let layout = { 
        title: `${props.coin} wash trading analysis`,
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
        <Plot
        data={data}
        layout={layout}
        />
    )

}

export default WashingVisuals
