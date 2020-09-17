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



# gets symbol name from the csv file
def get_symbol(f_path):
    # ../compressedBTCpairs/DENT-BTC.csv
    symbol_name = f_path.split('/')[-1].replace('.csv','')
    return symbol_name


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


def analyse_symbol(df,v_thresh,p_thresh,win_size=24,c_size='1m',plot=False):  
    '''
    USAGE:
    f_path : path to OHLCV csv e.g.'../data/binance/binance_STORJ-BTC_[2018-04-20 00.00.00]-TO-[2018-05-09 23.00.00].csv'
    v_thresh : volume threshold e.g. 5 (500%)
    p_thresh : price threshold e.g. 1.05 (5%)
    c_size : candle size
    win_size : size of the window for the rolling average, in hours
    '''
       
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
    
    return (df,final_combined)



def new_my_func(original_df, v_thresh=5, p_thresh=1.25):
    
    #has changes as ts_interval_begin

    v_thresh = float(v_thresh)
    p_thresh = float(p_thresh)

    original_df, pumpdf = analyse_symbol(original_df, v_thresh, p_thresh, win_size = 240,
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

    print("the new df with key error is:", original_df)

    if index_list:
        
        to_json_data = original_df[['ts_interval_begin','open','high','low','close','volume']]
        to_json_data['ts_interval_begin'] = to_json_data['ts_interval_begin'].dt.strftime('%Y-%m-%d %H:%M:%S')
        to_db = json.dumps(to_json_data.to_numpy().tolist())

        print("new  -------> attempting print: ", index_list)
        index_list = [(original_df.iloc[x]['ts_interval_begin'],int(x)) for x in index_list]
        print("new -------> print index list is: ", index_list)

        return to_db, index_list
    else:
        return []


# takes in 3 argumets coin, volume threshold and price threshold
@app.route('/anomalies', methods=['GET'])
def get_anomalies():

    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    
    coin = request.args.get('coin')
    v_thresh = request.args.get('v_thresh')
    p_thresh = request.args.get('p_thresh')
    interval = request.args.get('interval')
    
    # resample query below FINAL 900=900 seconds = 15 minutes
    # need to resample the minutes to second for the resample query
    
    interval_seconds = int(interval)*60
    sql_query = f'''SELECT to_timestamp(floor((extract('epoch' from open_time) / {interval_seconds} )) * {interval_seconds}) AT TIME ZONE 'UTC' as ts_interval_begin,
    (array_agg(open ORDER BY open_time ASC))[1] as open, (array_agg(open ORDER BY open_time DESC))[1] as close,
    MAX("high") as high, MIN("low") as low,SUM("volume") as volume 
    FROM pumpdump 
    WHERE coin='{coin}' 
    GROUP BY ts_interval_begin '''
    df = pd.read_sql(sql_query, conn)


    new_data = new_my_func(df, v_thresh, p_thresh)

    print("########## new is ###########")
    if new_data:
        print(new_data[1])
    else:
        print("Nothing here")

    conn.close()

    if new_data == []:
        return ({'data':{}, 'anomalies': {} })

    else:
        return ({'data':new_data[0], 'anomalies': new_data[1] })


##FRONT END WILL FUCK UP WITH INTERVAL need to fix!!!