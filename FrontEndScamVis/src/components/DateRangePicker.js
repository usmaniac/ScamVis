import React, { useState, useEffect } from 'react';
import DateTimeRangeContainer from 'react-advanced-datetimerange-picker'
import {FormControl} from 'react-bootstrap'
import moment from "moment"


function DateRangePicker() {
    
    const[state, setState] = useState({
        start: moment(),
        end: moment()
    })

    useEffect(async () => {
        let now = new Date();
        let start = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
        let end = moment(start).add(1, "days").subtract(1, "seconds");
        setState({
            start: start,
            end: end
        })
    }, [])

    function applyCallback(startDate, endDate){
        setState({
                start: startDate,
                end : endDate
            }
        )
        console.log("start is:", state.start)
    }


    let now = new Date();
    let start = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
    let end = moment(start).add(1, "days").subtract(1, "seconds");
    let ranges = {
        "Today Only": [moment(start), moment(end)],
        "Yesterday Only": [moment(start).subtract(1, "days"), moment(end).subtract(1, "days")],
        "3 Days": [moment(start).subtract(3, "days"), moment(end)]
    }
    let local = {
        "format":"DD-MM-YYYY HH:mm",
        "sundayFirst" : false
    }
    let maxDate = moment(start).add(24, "hour")
    let value = `${state.start.format(
        "DD-MM-YYYY HH:mm"
        )} - ${state.end.format("DD-MM-YYYY HH:mm")}`;

    return (
        <div>
              <DateTimeRangeContainer 
                        ranges={ranges}
                        start={state.start}
                        end={state.end}
                        local={local}
                        maxDate={maxDate}
                        applyCallback={applyCallback}
                    >    
                        <FormControl
                        id="formControlsTextB"
                        type="text"
                        label="Text"
                        placeholder="Enter text"
                        style={{ cursor: "pointer" }}
                        value={value}
                        /> 
                    </DateTimeRangeContainer>
        </div>
    )
}

export default DateRangePicker








 
// class Wrapper extends React.Component {
 
//     constructor(props){
//         super(props);
//         let now = new Date();
//         let start = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
//         let end = moment(start).add(1, "days").subtract(1, "seconds");
//         this.state = {
//             start : start,
//             end : end
//         }
 
//         this.applyCallback = this.applyCallback.bind(this);
//     }
 
//     applyCallback(startDate, endDate){
//         this.setState({
//                 start: startDate,
//                 end : endDate
//             }
//         )
//         console.log(this.state.start)
//     }
 
//     render(){
//             let now = new Date();
//             let start = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
//             let end = moment(start).add(1, "days").subtract(1, "seconds");
//             let ranges = {
//                 "Today Only": [moment(start), moment(end)],
//                 "Yesterday Only": [moment(start).subtract(1, "days"), moment(end).subtract(1, "days")],
//                 "3 Days": [moment(start).subtract(3, "days"), moment(end)]
//             }
//             let local = {
//                 "format":"DD-MM-YYYY HH:mm",
//                 "sundayFirst" : false
//             }
//             let maxDate = moment(start).add(24, "hour")
//             let value = `${this.state.start.format(
//                 "DD-MM-YYYY HH:mm"
//               )} - ${this.state.end.format("DD-MM-YYYY HH:mm")}`;


//             return(
//                 <div>
//                     <DateTimeRangeContainer 
//                         ranges={ranges}
//                         start={this.state.start}
//                         end={this.state.end}
//                         local={local}
//                         maxDate={maxDate}
//                         applyCallback={this.applyCallback}
//                     >    
//                         <FormControl
//                         id="formControlsTextB"
//                         type="text"
//                         label="Text"
//                         placeholder="Enter text"
//                         style={{ cursor: "pointer" }}
//                         value={value}
//                         /> 
//                     </DateTimeRangeContainer>
//                 </div>
//             );
//         }
// }

// export default Wrapper