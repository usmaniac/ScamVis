import React, { useEffect,useState } from 'react'
import axios from 'axios'

function WashingPriceDistributionVisuals(props) {
    const [coinImagePath, setCoinImagePath] = useState("")
    useEffect(() => {
        // // print('coin image path is:', coinImagePath)
        // if(props.coin){
        //     setCoinImagePath("./"+props.coin+"_trade_dist.png")
        // } else{
        //     // some default image here
        //     setCoinImagePath("./logo512.png")
        // }
        async function onStartup(){
            let x = await axios.get(`http://127.0.0.1:5000/plot.png`)
            let x2 = await Promise.resolve(x)
            setCoinImagePath(x2)
        }
        onStartup()
    }, [])

    return (
        <div>
            <img src="http://127.0.0.1:5000/plot.png"></img>
        </div>
    )
}

export default WashingPriceDistributionVisuals
