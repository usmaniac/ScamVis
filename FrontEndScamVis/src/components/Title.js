import React from 'react'

function Title() {
    return (
        <React.Fragment>
        <header style={headerStyle}>
            <h1 style={h1style}>ScamVis</h1>
            <h2 style={h2Style}> A visual toolkit to detect fraud in blockchains.</h2>
            <hr style={hrStyle}/>
        </header>
     
        </React.Fragment>
    ) 
}

const h1style = {
    fontWeight: '300',
    fontSize: '40px',
    fontFamily: ["Chronicle Display","Times Roman","Times New Roman"]
}

const h2Style = {
    fontFamily: ["Whitney SSm","sans-serif","Helvetica Neue","Helvetica","Arial"],
    fontStyle: 'normal',
    fontSize: '22px',
    lineHeight: '32px',
    letterSpacing: '-.5px',
    color: '#666',
    fontWeight: '300',
    marginTop: '0',
    textTransform: 'none'
}

const headerStyle = {
    color: '#333',
    textAlign: 'center',
    padding: '10px'

}

const hrStyle = {
    height: '2px',
    width: '55px',
    display: 'block',
    margin: '20px auto 15px',
    paddingTop: '0',
    backgroundColor: '#555',
    border: '0'
}

const byLineStyle = {
    color: '#666',
    clear: 'both',
    fontFamily: ["Chronicle SSm","Times Roman","Times New Roman"],
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: '24px'
}

export default Title
