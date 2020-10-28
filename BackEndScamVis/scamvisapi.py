from flask import Flask
from flask import request, Response
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
import json
from flask import jsonify, make_response


from datetime import datetime
import mplfinance as mpf
import psycopg2
from anomaly import Anomaly
import json
import base64

# wash trading imports
from loadandplot import BW
import io
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib import pyplot as plt
import seaborn as sns

import matplotlib
matplotlib.use('Agg')


trades_sample=[]
best_bid = []
best_ask = []
coin = ""
exchange = ""

def get_best(x):  
    # returns the best value of each bid/ask ie first non-zero
    # [['0.0009632', '0'], ['0.00097626', '25.66'], ['0.00097628', '61.75'], ['0.00097641', '0.59'], ['0.00097644', '25.66']]
    # in above list 0.0009632 would be skipped as the bid is for 0 order at price 0009632
    # x = json.loads(x) <-- dont need this with postgres method 
    size = 0
    i = 0
    while size == 0:
        if i == len(x):
            return np.nan
        bs = float(x[i][0])
        size = float(x[i][1])
        i += 1
    # print('bs returned is:', bs)
    return bs

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
                data = original_df[val-30:val+30][['ts_interval_begin', 'open', 'high', 'low', 'close', 'volume']]
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

    # time range begins now:
    
    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    
    coin = request.args.get('coin')
    v_thresh = request.args.get('v_thresh')
    p_thresh = request.args.get('p_thresh')
    interval = request.args.get('interval')
    win_size = request.args.get('win_size')

    from_time = request.args.get('from_time')
    to_time = request.args.get('to_time')

    interval_seconds = int(interval)*60
    print("uzzy haydos INTERVAL SECONDS IS: ", interval_seconds)
    # resample query below FINAL 900=900 seconds = 15 minutes
    # need to resample the minutes to second for the resample query

    sql_query = ''

    if from_time and to_time:
        print("we received arugment:", from_time)
    #     # correct query when to and from is provided is:
    #     # a lot of no pumps in this range/further testing needed
    #     sql_query = f'''SELECT to_timestamp(floor((extract('epoch' from open_time) / {interval_seconds} )) * {interval_seconds}) AT TIME ZONE 'UTC' as ts_interval_begin,
    #     (array_agg(open ORDER BY open_time ASC))[1] as open, (array_agg(open ORDER BY open_time DESC))[1] as close,
    #     MAX("high") as high, MIN("low") as low,SUM("volume") as volume 
    #     FROM test_ohlcv 
    #     WHERE coin='{coin}' 
    #     AND open_time >= '{fin_from_time}' AND open_time <= '{fin_to_time}'
    #     GROUP BY ts_interval_begin '''
    else:
        print("we did not receive both to and from")
    
    sql_query = f'''SELECT to_timestamp(floor((extract('epoch' from open_time) / {interval_seconds} )) * {interval_seconds}) AT TIME ZONE 'UTC' as ts_interval_begin,
    (array_agg(open ORDER BY open_time ASC))[1] as open, (array_agg(open ORDER BY open_time DESC))[1] as close,
    MAX("high") as high, MIN("low") as low,SUM("volume") as volume 
    FROM test_ohlcv 
    WHERE coin='{coin}' 
    GROUP BY ts_interval_begin '''
    
    df = pd.read_sql(sql_query, conn)
    new_data = historical_anomalies(df, v_thresh, p_thresh, win_size)
    results = [obj.__dict__ for obj in new_data]
    if from_time and to_time:
        print("received from and to")
        temp_date_time = ' '.join(from_time.split()[1:5])
        datetime_object_from = datetime.strptime(temp_date_time, '%b %d %Y %H:%M:%S')

        temp_date_time = ' '.join(to_time.split()[1:5])
        datetime_object_to = datetime.strptime(temp_date_time, '%b %d %Y %H:%M:%S')

        results = [x for x in results if datetime_object_from <= datetime.strptime( x['anomaly_date'], '%Y-%m-%d %H:%M:%S') and datetime.strptime( x['anomaly_date'], '%Y-%m-%d %H:%M:%S') <= datetime_object_to]

    print("rests is:", results)
    return json.dumps({"results": results})



@app.route('/live_feed', methods=['GET'])
def get_live_anomalies():

    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    
    coin = request.args.get('coin')
    v_thresh = request.args.get('v_thresh')
    p_thresh = request.args.get('p_thresh')
    
    sql_query = f'''SELECT open_time, open, high, low, close, volume 
    FROM pumpdump 
    WHERE coin='{coin}' 
    ''' 
    
    df = pd.read_sql(sql_query, conn)
    ra_vol_df = live_data_feed(df, v_thresh, p_thresh)

    print("ra_vol_df:", ra_vol_df) 
    print("last volume: ", ra_vol_df.iloc[-1]['120m Volume RA'] )
    print("last price:",ra_vol_df.iloc[-1]['120m Close Price RA'] )
    print("last row is: ", ra_vol_df.iloc[-1])

    dump_price_thresh = 1- (float(p_thresh) - 1)
    dump_vol_thresh = 1- (float(v_thresh) - 1)

    print("dump_price_thresh:", dump_price_thresh)
    print("dump_vol_thresh:", dump_vol_thresh)

    pump_or_not = False
    if float(ra_vol_df.iloc[-1]['high']) >= float(p_thresh) * float(ra_vol_df.iloc[-1]['120m Close Price RA']) and float(ra_vol_df.iloc[-1]['volume']) >= float(v_thresh) * float(ra_vol_df.iloc[-1]['120m Volume RA']):
        pump_or_not = True
    if dump_price_thresh > 0:
        if float(ra_vol_df.iloc[-1]['high']) <= dump_price_thresh * float(ra_vol_df.iloc[-1]['120m Close Price RA']):
            pump_or_not = True
    
    data = []
    df['open_time'] = df['open_time'].apply(str)
    # different api call (changes because of the interval)
    data = df[-30:][['open_time', 'open', 'high', 'low', 'close', 'volume']].values.tolist()
    
    return json.dumps (
        {
        'visualisation_data':data,
        'pump_or_not': pump_or_not,
        'current_time':str(ra_vol_df.iloc[-1]['open_time']),
        'current_volume_ra': ra_vol_df.iloc[-1]['120m Volume RA'], 
        'current_price_ra': ra_vol_df.iloc[-1]['120m Close Price RA']
        } 
    )


@app.route('/wash_trading_graphs', methods=['GET'])
def get_wash_trades():
    global best_ask
    global best_bid
    global trades_sample
    global coin
    global exchange

    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    coin = request.args.get('coin')
    exchange = request.args.get('exchange')

    # from_time = request.args.get('from_time')
    # to_time = request.args.get('to_time')

    best_bid_x_values = []
    best_bid_y_values = []
    best_ask_x_values = []
    best_ask_y_values = []
    market_buy_x_values = []
    market_buy_y_values = []
    market_sell_x_values = []
    market_sell_y_values = []
    binance_trades_x_values=[]
    binance_trades_y_values=[]
    
    # sample query with date range:
    # select * from wash_trading_orders where local_time >= '2020-10-19 07:47' and local_time<='2020-10-19 7:50' and exchange='BW';

    # ADD date range to query
    get_trades_query = f'''
    SELECT * FROM wash_trading_trades WHERE coin='{coin}' and exchange='{exchange}' ORDER BY local_time 
    '''
    trades_sample = pd.read_sql(get_trades_query, conn)
    print("trades df is: ", trades_sample)
    
    # ADD date range to query: books sample
    get_books_query = f'''
    SELECT * FROM wash_trading_orders WHERE coin='{coin}' and exchange='{exchange}' ORDER BY local_time 
    '''
    books_sample = pd.read_sql(get_books_query, conn)
    print("books df is:", books_sample)
    print("column names:", books_sample.columns)
    books_sample = books_sample[(books_sample['local_time'] > trades_sample['local_time'].min()) & (books_sample['local_time'] < trades_sample['local_time'].max())]

    print("books-sample is: ", books_sample) #this is empty for eos-btc trading pair

    best_bid = books_sample['bids'].apply(get_best)  #applies get_best to each value
    best_ask = books_sample['asks'].apply(get_best)
    best_bid.index = books_sample['local_time']
    best_ask.index = books_sample['local_time']
    best_bid = best_bid.loc[best_bid.shift() != best_bid].dropna()  #wht does this mean --> the value after isnt exactly the same
    best_ask = best_ask.loc[best_ask.shift() != best_ask].dropna()

    best_bid.shape, best_ask.shape, trades_sample.shape #whats the point in this(??)
   
    best_bid_x_values = best_bid.iloc[::1].index.tolist()
    best_bid_x_values = [str(x) for x in best_bid_x_values]
    print(best_bid_x_values)
    best_bid_y_values = best_bid.iloc[::1].to_numpy().tolist()
    print(best_bid_y_values)


    best_ask_x_values = best_ask.iloc[::1].index.tolist()
    best_ask_x_values = [str(x) for x in best_ask_x_values]
    print("best ask x:" , best_ask_x_values)
    best_ask_y_values = best_ask.iloc[::1].to_numpy().tolist()
    print("best ask y:", best_ask_y_values)

    if (exchange != 'Binance'):
        market_buy_x_values = trades_sample[trades_sample['side'] == 2]['local_time'].to_numpy()
        market_buy_x_values = [str(x) for x in market_buy_x_values]
        print("market x values is:", market_buy_x_values)
        market_buy_y_values = trades_sample[trades_sample['side'] == 2]['price'].to_numpy().tolist()
        print("market y values is: ", market_buy_y_values)
        market_sell_x_values = trades_sample[trades_sample['side'] == 1]['local_time'].to_numpy()
        market_sell_x_values = [str(x) for x in market_sell_x_values]
        market_sell_y_values = trades_sample[trades_sample['side'] == 1]['price'].to_numpy().tolist()
    
    else:
        print("Exchange is binance")
        binance_trades_x_values = trades_sample['local_time'].to_numpy()
        binance_trades_x_values = [str(x) for x in binance_trades_x_values]
        binance_trades_y_values = trades_sample['price'].to_numpy().tolist()

        print("binance trades here is: ", binance_trades_x_values)
       
    return json.dumps({
        'best_bid_x_values': best_bid_x_values,
        'best_bid_y_values': best_bid_y_values,
        'best_ask_x_values': best_ask_x_values,
        'best_ask_y_values': best_ask_y_values,
        'market_buy_x_values': market_buy_x_values,
        'market_buy_y_values': market_buy_y_values,
        'market_sell_x_values': market_sell_x_values,
        'market_sell_y_values': market_sell_y_values,
        'binance_trades_x_values': binance_trades_x_values,
        'binance_trades_y_values': binance_trades_y_values,
        'symbol': coin,
    })

@app.route('/plot.png')
def plot_png():
    fig = create_figure()
    output = io.BytesIO()
    FigureCanvas(fig).print_png(output)
    return Response(output.getvalue(), mimetype='image/png')

def create_figure():
    # fig = Figure()
    global trades_sample
    global best_bid
    global best_ask
    trades_seq = trades_sample[['local_time', 'price', 'size']].set_index('local_time', drop=True)
    # Concatenating best_bid, best_ask and trades data
    trades_mid_diff = pd.concat([trades_seq, best_bid]).rename(columns={0: 'best_bid'}).sort_index()
    trades_mid_diff = pd.concat([trades_mid_diff, best_ask]).rename(columns={0: 'best_ask'}).sort_index()
    # Calculating price delta
    trades_mid_diff.loc[:, ['best_bid', 'best_ask']] = trades_mid_diff[['best_bid', 'best_ask']].ffill()
    trades_mid_diff.dropna(inplace=True)
    midprice = (trades_mid_diff['best_ask'] + trades_mid_diff['best_bid']) / 2
    spread = trades_mid_diff['best_ask'] - trades_mid_diff['best_bid']
    trades_mid_diff['price_delt'] = (midprice - trades_mid_diff['price']) / spread
    
    fig, axis = plt.subplots(figsize=(12,6)) 
    sns.distplot(trades_mid_diff['price_delt'], bins=50) #fills in the subplot here
    plt.title(f'''Distribution of value "(Trade_price - Mid_price) / '
    '(Spread)" for {coin} on {exchange}''')
    
    return fig 

# Return multiple images = append to array
@app.route('/buy_sell.png')
def plot_buy_sell_png():
    fig = create_buy_sell_figure()
    output = io.BytesIO()
    FigureCanvas(fig).print_png(output)
    return Response(output.getvalue(), mimetype='image/png')


# discuss with Dilum, this endpoint doesn't always show data, relies on milliseconds between data
def create_buy_sell_figure():
    # Sell Figures
    global coin
    global exchange
    global trades_sample
    # trades_int = (trades_sample['local_time'][trades_sample['side'] == 1].diff().dt.seconds * 1e6 + 
    #           trades_sample['local_time'][trades_sample['side'] == 1].diff().dt.microseconds).dropna()
    # trades_int = trades_int[trades_int >= 0]
    # fig, ax = plt.subplots(figsize=(12, 6))
    # sns.distplot(trades_int[trades_int < 1e5],  
    #             hist_kws={'range': (0, 1e5)},
    #             kde_kws={'clip': (0, 1e5)},
    #             bins=100)
    # plt.title(f'SELL Trades interval distribution for {coin} on {exchange}')

    # Buy side
    trades_int = (trades_sample['local_time'][trades_sample['side'] == 2].diff().dt.seconds * 1e6 + 
              trades_sample['local_time'][trades_sample['side'] == 2].diff().dt.microseconds).dropna()
    trades_int = trades_int[trades_int >= 0]
    fig, ax = plt.subplots(figsize=(12, 6))
    sns.distplot(trades_int[trades_int < 1e5],  
                hist_kws={'range': (0, 1e5)},
                kde_kws={'clip': (0, 1e5)},
                bins=100)
    plt.title(f'SELL Trades interval distribution for {coin} on {exchange}')

    return fig
