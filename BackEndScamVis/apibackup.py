from flask import Flask
from flask import request
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

import ccxt
import pandas as pd
import statistics as stat
from math import pi
import time
import random
import os
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.graph_objs import *
import json
from flask import jsonify, make_response


from datetime import datetime
import mplfinance as mpf




#plotting
from bokeh.plotting import figure, show, output_file
from bokeh.io import export_svgs
from bokeh.io import output_notebook
from bokeh.models import Axis, ColumnDataSource
from bokeh.layouts import gridplot
from bokeh.plotting import figure


# gets symbol name from the csv file
def get_symbol(f_path):
    # ../compressedBTCpairs/DENT-BTC.csv
    symbol_name = f_path.split('/')[-1].replace('.csv','')
    return symbol_name


# extracts the symbol pairs and stores them in a df per exchange (not sure if needed for our exchange only have binance data)
def extract_symbol_df_from_csvs(folder):
    for subdir, dirs, files in os.walk(folder):
        symbols = []
        
        exchange_n = 'Binance'
        
        for file in files:
            if ".csv" in file:
                f = file.split('-')
                symbols.append(f[0]+'/'+f[1].replace('.csv',''))
        header = ['Symbol']
        df = pd.DataFrame(symbols, columns=header)
        filename = '{}_symbols.csv'.format(exchange_n)
        df.to_csv(filename) #creates binace_symbols.csv

#postponed for now
#def analyse_symbol(f_path,v_thresh,p_thresh,win_size=24,c_size='1h',plot=False):  

def find_vol_spikes(df,v_thresh,win_size):
    # -- add rolling average column to df --
    #vRa = volume rolling average
    vRA = str(win_size)+'m Volume RA'

    #add rolling average to df
    add_RA(df,win_size,'volume',vRA)
    
    # -- find spikes -- 
    vol_threshold = v_thresh*df[vRA] # v_thresh increase in volume

    #where the volume is at least v_thresh greater than the x-axis-minute RA
    vol_spike_mask = df["volume"] > vol_threshold  #boolean returned
    df_vol_spike = df[vol_spike_mask] #only when true we get something here
    
    return (vol_spike_mask,df_vol_spike)


def find_price_spikes(df,p_thresh,win_size):
    # -- add rolling average column to df --
    pRA = str(win_size)+'m Close Price RA'
    add_RA(df,win_size,'close',pRA)
    
    # -- find spikes -- 
    p_threshold = p_thresh*df[pRA] # p_thresh increase in price
    p_spike_mask = df["high"] > p_threshold # where the high is at least p_thresh greater than the x-hr RA
    df_price_spike = df[p_spike_mask]
    return (p_spike_mask,df_price_spike)


def add_RA(df,win_size,col,name):
    df[name] = pd.Series.rolling(df[col],window=win_size,center=False).mean()


def load_csv(f_path,interval,suppress=True,):
    '''suppress : suppress output of the exchange and symbol name'''
    
    # df = pd.read_csv(f_path,index_col=0,parse_dates=["open_time"])
    # filename = os.path.basename(f_path)
    # exchange_name = filename.split("_")[0]
    # symbol_name = filename.split("_")[1].replace("-","/")

    df = pd.read_csv(f_path, index_col=0,parse_dates=["open_time"]) 
    # df = pd.read_csv(f_path)
    df.drop(columns = ['quote_asset_volume','number_of_trades','taker_buy_base_asset_volume','taker_buy_quote_asset_volume'],inplace=True)

    symbol_name=get_symbol(f_path)
    print("symbol at load_csv is:", symbol_name)
    exchange_name = 'Binance'

    ohlc_dict = {                                                                                                             
    'open':'first',                                                                                                    
    'high':'max',                                                                                                       
    'low':'min',                                                                                                        
    'close': 'last',                                                                                                    
    'volume': 'sum'
    }
    
    print("interval is:", interval)

    df = df.resample(f'{interval}T').agg(ohlc_dict).bfill()
    print("df head:", df.head())
    df.reset_index(inplace=True)

    print('df in load csv:', df)

    if not suppress:
        print("Exchange:",exchange_name,"\nSymbol:",symbol_name)
        
    return (exchange_name,symbol_name,df)

def get_num_rows(df):
    return df.shape[0]


def find_price_dumps(df,win_size):
    pRA = str(win_size)+"m Close Price RA"
    pRA_plus = pRA + "+" + str(win_size)
    
    df[pRA_plus] = df[pRA].shift(-win_size)
    price_dump_mask = df[pRA_plus] <= (df[pRA] + df[pRA].std())
    # if the xhour RA from after the pump was detected is <= the xhour RA (+std dev) from before the pump was detected
    # if the price goes from the high to within a range of what it was before
    
    df_p_dumps = df[price_dump_mask]
    return (price_dump_mask,df_p_dumps)

def find_volume_dumps(df,win_size):
    vRA = str(win_size)+"m Volume RA"
    vRA_plus = vRA + "+" + str(win_size)
    
    df[vRA_plus] = df[vRA].shift(-win_size)
    price_dump_mask = df[vRA_plus] <= (df[vRA] + df[vRA].std())
    # if the xhour RA from after the pump was detected is <= the xhour RA (+std dev) from before the pump was detected
    # if the volume goes from the high to within a range of what it was before
    
    df_p_dumps = df[price_dump_mask]
    return (price_dump_mask,df_p_dumps)

def rm_same_day_pumps(df):
    # Removes spikes that occur on the same day
    df = df.copy()
    df['open_time_DAYS'] = df['open_time'].apply(lambda x: x.replace(hour=0, minute=0, second=0))
    df = df.drop_duplicates(subset='open_time_DAYS', keep='last')
    return df


def plot_markers(plot, df, xcol_name, ycol_name, color="red", marker="x",legend_name=None):
    markers = plot.scatter(df[xcol_name], df[ycol_name], color=color, marker=marker, legend=legend_name, 
                           muted_alpha = 0.5, muted_color=color)
    markers.glyph.size = 10
    markers.glyph.line_width = 2
    markers.level = 'overlay'
    return markers



# Main plotting method 
def plot_pumps(symbol_name,exchange_name,win_size,df,p_spike_df,v_spike_df,vp_combined_df,price_dump_df,final_df,final_df_rm,
                   plot_pRA=True,plot_ppeaks=True,plot_vRA=True,plot_vpeaks=True):
    '''
    Still needs support for different candle times (change w, not hard)
    '''
    TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

    # ---CANDLE PLOT---
    inc = df.close > df.open
    dec = df.open > df.close

    msec = 1000
    minute = 60 * msec
    hour = 60 * minute

    w = hour/2 # half an hour (should be half the candle size)

    p_candle = figure(x_axis_type="datetime", tools=TOOLS, plot_width=1000, plot_height=450, 
                      title = symbol_name+" Candlestick"+" | Exchange: "+exchange_name, y_axis_label='Price')
    p_candle.xaxis.major_label_orientation = pi/4
    p_candle.grid.grid_line_alpha=0.3

    # turn off scientific notation for y axis
    yaxis = p_candle.select(dict(type=Axis, layout="left"))[0]
    yaxis.formatter.use_scientific = False

    # plot candles
    p_candle.segment(df.open_time, df.high, df.open_time, df.low, color="black")
    p_candle.vbar(df.open_time[inc], w, df.open[inc], df.close[inc], fill_color="#40a075", line_color="black") # green
    p_candle.vbar(df.open_time[dec], w, df.open[dec], df.close[dec], fill_color="#F2583E", line_color="black") # red

    # marking peaks
    if plot_ppeaks:
        price_peaks = plot_markers(p_candle,p_spike_df,'open_time','high',legend_name='Price Increase',color="orange")
        combined_peaks = plot_markers(p_candle,vp_combined_df,'open_time','high',legend_name='Price + Volume Increase',color="brown")
        price_dumps = plot_markers(p_candle,final_df,'open_time','high',legend_name='Price + Volume Increase + Volume Decrease',color="red")
        final = plot_markers(p_candle,final_df_rm,'open_time','high',legend_name='Pump and Dump',color="blue",marker="diamond")

    # price rolling avg
    if plot_pRA:
        pRA = str(win_size)+"m Close Price RA"
        p_ra_leg = str(win_size)+"h Rolling Avg."
        p_candle.line(df.open_time, df[pRA], line_width=2, color="green",legend=p_ra_leg)


    # add mutable legend
    p_candle.legend.location = "top_right"
    p_candle.legend.click_policy= "mute"


    # ---VOLUME PLOT---
    # create a new plot with a title and axis labels
    p_vol = figure(tools=TOOLS, x_axis_label='Date', y_axis_label='Volume',
                   x_axis_type="datetime",x_range=p_candle.x_range, plot_width=1000, plot_height=200)

    vol_yaxis = p_vol.select(dict(type=Axis, layout="left"))[0]
    vol_yaxis.formatter.use_scientific = False

    # plot volume
    p_vol.line(df.open_time, df.volume, line_width=2)

    # marking peaks
    if plot_vpeaks:
        vol_peaks = plot_markers(p_vol,v_spike_df,'open_time','volume',legend_name='Volume Increase',color="purple")
        combined_vol_peaks = plot_markers(p_vol,vp_combined_df,'open_time','volume',legend_name='Price + Volume Increase',color="magenta")
        combined_dump_vol = plot_markers(p_vol,final_df,'open_time','volume',legend_name='Price + Volume Increase + Volume Decrease',color="red")

    # rolling avg
    if plot_vRA:
        vRA = str(win_size)+"m Volume RA"
        v_ra_leg = str(win_size)+"m Rolling Avg."
        p_vol.line(df.open_time, df[vRA], line_width=2, color="green",legend=v_ra_leg)

    # add mutable legend
    p_vol.legend.location = "top_right"
    p_vol.legend.click_policy= "mute"
    
    # change num ticks
    p_candle.xaxis[0].ticker.desired_num_ticks = 20
    p_vol.xaxis[0].ticker.desired_num_ticks = 20


    # ---COMBINED PLOT---
    p = gridplot([[p_candle],[p_vol]])

    # output_notebook()
    p_candle.output_backend = "svg"
    p_vol.output_backend = "svg"
    show(p)




def analyse_symbol(f_path,v_thresh,p_thresh,interval,win_size=24,c_size='1m',plot=False):  
    '''
    USAGE:
    f_path : path to OHLCV csv e.g.'../data/binance/binance_STORJ-BTC_[2018-04-20 00.00.00]-TO-[2018-05-09 23.00.00].csv'
    v_thresh : volume threshold e.g. 5 (500%)
    p_thresh : price threshold e.g. 1.05 (5%)
    c_size : candle size
    win_size : size of the window for the rolling average, in hours
    '''
    # -- load the data --
    exchange_name,symbol_name,df = load_csv(f_path, interval)


    print("df returnd from laod_csv: ", df)
    print("########")


    
    # -- find spikes --
    vmask,vdf = find_vol_spikes(df,v_thresh,win_size)
    num_v_spikes = get_num_rows(vdf) # the number of volume spikes 

    pmask,pdf = find_price_spikes(df,p_thresh,win_size)
    num_p_spikes = get_num_rows(pdf)

    pdmask,pddf = find_price_dumps(df,win_size)
    vdmask,vddf = find_volume_dumps(df,win_size)
    
    # find coinciding price and volume spikes
    vp_combined_mask = (vmask) & (pmask)
    vp_combined_df = df[vp_combined_mask]
    num_vp_combined_rows = get_num_rows(vp_combined_df)
    
    # find coniciding price and volume spikes with dumps afterwards     
    final_combined_mask = (vmask) & (pmask) & (pdmask)
    final_combined = df[final_combined_mask]
    

    # After
    num_final_combined = get_num_rows(final_combined)
    
    row_entry = {'Exchange':exchange_name,
                 'Symbol':symbol_name,
                 'Price Spikes':num_p_spikes,
                 'Volume Spikes':num_v_spikes,
                #  'Alleged Pump and Dumps':num_alleged,
                 'Pump and Dumps':num_final_combined}
    
    print("row_entry: ", row_entry)


    print("df being returned from analyse symbol:", df)
    print("########")


    return (df,final_combined,row_entry)


def my_func(coin='DENT-BTC', v_thresh=5, p_thresh=1.25, interval=15):
    
    v_thresh = float(v_thresh)
    p_thresh = float(p_thresh)

    original_df, pumpdf, row_entry = analyse_symbol(f'../compressedBTCpairs/{coin}.csv',v_thresh, p_thresh, interval, win_size = 240,
    c_size = '1m', plot=False)

    # get the indices of our pumpdf
    index_first = list(pumpdf.index.values)
    index_list = []
    print("index first=", index_first)

    # removing "pumps" that are part of same pump section
    ref = 0
    for i,val in enumerate(index_first):
        if i == 0:
            ref = val
            index_list.append(val)
        if val > ref + 60:
            index_list.append(val)
            ref = val
        else:
            continue

    print("index list=", index_list)

    # Obtain data from the data frame
    i = 0 #ith element in index list (THIS IS WHY ONLY ONE PUMP VISUALISED FOR NOW!!!!!!!!)
    increment = 100

    if index_list:
        ####### working section for printing purposes only #######
        # end = index_list[i]+increment
        # start = index_list[i]-increment
        # if int(index_list[i])-increment < 0:
        #     start = 0
        # if int(index_list[i])+increment > int(original_df.index[-1]):
        #     end = original_df.index[-1]

        # temp_df =  original_df.iloc[start:end]  #intraday data
        # fig = px.line(temp_df, x='open_time', y='high')
        # fig.show()

        # to_json_data = temp_df[['open_time','open','high','low','close','volume']]
        ##########

        to_json_data = original_df[['open_time','open','high','low','close','volume']]
        to_json_data['open_time'] = to_json_data['open_time'].dt.strftime('%Y-%m-%d %H:%M:%S')
        to_db = json.dumps(to_json_data.to_numpy().tolist())

        print("attempting print: ", index_list)
        index_list = [(original_df.iloc[x]['open_time'],int(x)) for x in index_list]
        print("print index list is: ", index_list)

        return to_db, index_list
    else:
        return 'no results found'


# takes in 3 argumets coin, volume threshold and price threshold
@app.route('/anomalies', methods=['GET'])
def get_anomalies():

    # change this endpoint and everything obtained from database .. ?

    coin = request.args.get('coin')
    v_thresh = request.args.get('v_thresh')
    p_thresh = request.args.get('p_thresh')
    interval = request.args.get('interval')
    x = my_func(coin, v_thresh, p_thresh,interval)
  
    return ({'data':x[0], 'anomalies': x[1] })

##FRONT END WILL FUCK UP WITH INTERVAL need to fix!!!