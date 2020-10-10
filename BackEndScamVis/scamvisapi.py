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
import psycopg2
from anomaly import Anomaly
import json




# gets symbol name from the csv file
def get_symbol(f_path):
    # ../compressedBTCpairs/DENT-BTC.csv
    symbol_name = f_path.split('/')[-1].replace('.csv','')
    return symbol_name


def find_vol_spikes(df,v_thresh,win_size, live=False):
    # -- add rolling average column to df --
    #vRa = volume rolling average
    vRA = str(win_size)+'m Volume RA'

    #add rolling average to df
    add_RA(df,win_size,'volume',vRA)
    
    # -- find spikes -- 
    vol_threshold = v_thresh*df[vRA] # v_thresh increase in volume

    if live == True:
        print("volume with rolling average df")
        print(df)
        return(df)

    #where the volume is at least v_thresh greater than the x-axis-minute RA
    vol_spike_mask = df["volume"] > vol_threshold  #boolean returned
    df_vol_spike = df[vol_spike_mask] #only when true we get something here
    
    return (vol_spike_mask,df_vol_spike)


def find_price_spikes(df,p_thresh,win_size, live=False):
    # -- add rolling average column to df --
    pRA = str(win_size)+'m Close Price RA'
    add_RA(df,win_size,'close',pRA)
    
    if(live==True):
        return df

    # -- find spikes -- 
    p_threshold = p_thresh*df[pRA] # p_thresh increase in price
    p_spike_mask = df["high"] > p_threshold # where the high is at least p_thresh greater than the x-hr RA
    df_price_spike = df[p_spike_mask]
    return (p_spike_mask,df_price_spike)


def add_RA(df,win_size,col,name):
    df[name] = pd.Series.rolling(df[col],window=win_size,center=False).mean()


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


def analyse_symbol(df,v_thresh,p_thresh,win_size=120,c_size='1m',plot=False):  
    '''
    USAGE:
    f_path : path to OHLCV csv e.g.'../data/binance/binance_STORJ-BTC_[2018-04-20 00.00.00]-TO-[2018-05-09 23.00.00].csv'
    v_thresh : volume threshold e.g. 5 (500%)
    p_thresh : price threshold e.g. 1.05 (5%)
    c_size : candle size
    win_size : size of the window for the rolling average in minutes, (since I change c_size from 1 hour to to 1m)
    '''

    print("win_size in analyse symbol is:", win_size)
       
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

    # print("final combined df:", final_combined)
    

    # After
    num_final_combined = get_num_rows(final_combined)

    row_entry = {'Exchange':'Binance',
                 'Price Spikes':num_p_spikes,
                 'Volume Spikes':num_v_spikes,
                 'Pump and Dumps':num_final_combined}
    print(row_entry)
    
    return (df,final_combined)



def historical_anomalies(original_df, v_thresh=5, p_thresh=1.25, win_size=120):
    
    # has changes as ts_interval_begin
    print("win_size historical anomalies is:", win_size)

    v_thresh = float(v_thresh)
    p_thresh = float(p_thresh)
    win_size = int(win_size)

    original_df, pumpdf = analyse_symbol(original_df, v_thresh, p_thresh, win_size,
    c_size = '1m', plot=False)

    # get the indices of our pumpdf
    index_first = list(pumpdf.index.values)
    index_list = []
    # print("index first=", index_first)

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

    if index_list:
        anom_list = []
        print("new  -------> attempting print: ", index_list)
        for val in index_list:
            anomaly_date = str(original_df.iloc[val]['ts_interval_begin'])
            if (val-30) < 0:
                data = original_df[val:val+30]
            elif (val+30 > len(original_df.index)):
                data = original_df[val-30:val]
            else:
                data = original_df[val-30:val+30][['ts_interval_begin', 'open', 'close', 'high', 'low', 'volume']]
            data['ts_interval_begin'] = data['ts_interval_begin'].apply(str)
            anom_object = Anomaly(anomaly_date, data.values.tolist())
            anom_list.append(anom_object)
        return anom_list
    else:
        return []


def live_data_feed(df, v_thresh, p_thresh):
    v_thresh = float(v_thresh)
    p_thresh = float(p_thresh)
    df_volume = find_vol_spikes(df, v_thresh, 120, True)  
    df_price = find_price_spikes(df, p_thresh, 120,True)

    print(df_price)

    return df_price


# takes in 3 argumets coin, volume threshold and price threshold
@app.route('/anomalies', methods=['GET'])
def get_anomalies():

    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    
    coin = request.args.get('coin')
    v_thresh = request.args.get('v_thresh')
    p_thresh = request.args.get('p_thresh')
    interval = request.args.get('interval')
    win_size = request.args.get('win_size')

    # print("win_size is: ", win_size) 
    
    # resample query below FINAL 900=900 seconds = 15 minutes
    # need to resample the minutes to second for the resample query
    # NEED TO CONSIDER TIME RANGE FOR THIS SELECT QUERY
    
    interval_seconds = int(interval)*60
    print("uzzy haydos INTERVAL SECONDS IS: ", interval_seconds)
    sql_query = f'''SELECT to_timestamp(floor((extract('epoch' from open_time) / {interval_seconds} )) * {interval_seconds}) AT TIME ZONE 'UTC' as ts_interval_begin,
    (array_agg(open ORDER BY open_time ASC))[1] as open, (array_agg(open ORDER BY open_time DESC))[1] as close,
    MAX("high") as high, MIN("low") as low,SUM("volume") as volume 
    FROM test_ohlcv 
    WHERE coin='{coin}' 
    GROUP BY ts_interval_begin '''
    df = pd.read_sql(sql_query, conn)


    new_data = historical_anomalies(df, v_thresh, p_thresh, win_size)
    results = [obj.__dict__ for obj in new_data]
    print("rests is:", results)
    return json.dumps({"results": results})



@app.route('/live_feed', methods=['GET'])
def get_live_anomalies():

    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    
    coin = request.args.get('coin')
    v_thresh = request.args.get('v_thresh')
    p_thresh = request.args.get('p_thresh')
    
    # 60=60 seconds --> measuring 1 minute intervals

    # get the df RA after every 5 seconds
    # repeated calls on the front end
    
    sql_query = f'''SELECT open_time, open, high, low, close, volume 
    FROM pumpdump 
    WHERE coin='{coin}' 
    ''' #only 1 min data anyway so need to regroup
    #where open_time >= NOW - 2*window_size

    # dont load the entire table into the df
    # returning now: {'current_time': '2019-01-01 04:42:00', 'current_volume_ra': 2572.25, 'current_price_ra': 3.852083333333338e-06}
    # should also return entire dataset  (sql_query will return the dataset anyway)
    # same datasource used to visualise and calculate rolling average
    # store new data points in memory as we get them 
    

    df = pd.read_sql(sql_query, conn)


    ra_vol_df = live_data_feed(df, v_thresh, p_thresh)

    print("ra_vol_df:", ra_vol_df) 

    print("last volume: ", ra_vol_df.iloc[-1]['120m Volume RA'] )
    print("last price:",ra_vol_df.iloc[-1]['120m Close Price RA'] )

    print("last row is: ", ra_vol_df.iloc[-1])

    return json.dumps ( { 'current_time':str(ra_vol_df.iloc[-1]['open_time']),'current_volume_ra': ra_vol_df.iloc[-1]['120m Volume RA'], 'current_price_ra': ra_vol_df.iloc[-1]['120m Close Price RA']} )

# visualisation:
# refresh the graph not the page
# go to the database only once 
# one to calculate the roling /one to get 
# do tthat in a signle request