import os
import json
import numpy as np
import pandas as pd
import datetime as dt

from plotly.offline import download_plotlyjs, init_notebook_mode, plot, iplot
import plotly
import plotly.graph_objs as go

class BW:
    
    def __init__(self, path):
        self.path = path
        self.files = os.listdir(path)
        self.stock = 'BW'
        self.start_date = dt.datetime(2019,2,22)  # Load data files from this date
        
    def load_books(self):
        files = [x for x in self.files if 'books' in x]
        files = [x for x in files if pd.to_datetime(x.split('.')[1]) > self.start_date]
        df = pd.DataFrame()
        for file in files:
            print(f'Loading {file} ...')
            df_file = pd.read_csv(os.path.join(self.path, file), sep=';', header=None)
            if len(df_file) > 0:
                df = pd.concat([df, df_file])
        df.columns = ['symbol', 'local_time', 'bids', 'asks']
        df.loc[:, 'local_time'] = pd.to_datetime(df['local_time'])
        return df.sort_values(by='local_time').reset_index(drop=True)
    
    def load_trades(self):
        files = [x for x in self.files if 'trades' in x]
        files = [x for x in files if pd.to_datetime(x.split('.')[1]) > self.start_date]
        df = pd.DataFrame()
        for file in files:
            print(f'Loading {file} ...')
            df_file = pd.read_csv(os.path.join(self.path, file), sep=';', header=None)
            if len(df_file) > 0:
                df = pd.concat([df, df_file])
        df.columns = ['symbol', 'exch_time', 'local_time', 'price', 'size', 'side']  #tid, amount are useless never get used
        df.loc[:, 'exch_time'] = pd.to_datetime(df['exch_time'])
        df.loc[:, 'local_time'] = pd.to_datetime(df['local_time'])
        df.loc[:, 'side'] = df['side'].map({1: 2, 2: 1}) #wtf!!!!
        print ("df is:")
        print(df)
        return df.sort_values(by='local_time').reset_index(drop=True)
    
    def plotly_trades(self, trades_sample, best_bid, best_ask, symbol):
        
        base, quot = symbol.split('_')

        # all of these are empty
        # these are all dataframe
        print("trades_sample:", trades_sample)
        print("best_bid:", best_bid)
        print("best_ask", best_ask)
        print("symbol:", symbol)

        trace0 = go.Scatter(
            x = trades_sample[trades_sample['side'] == 2]['local_time'],
            y = trades_sample[trades_sample['side'] == 2]['price'],
            name = 'Market BUY',
            mode = 'markers',
            marker = dict(
                size = 10,
                color = '#3F4B7F',
                symbol = 'triangle-up',
                line = dict(
                    width = 0,
                    color = '#3F4B7F'
                )
            )
        )

        trace1 = go.Scatter(
            x = trades_sample[trades_sample['side'] == 1]['local_time'],
            y = trades_sample[trades_sample['side'] == 1]['price'],
            name = 'Market SELL',
            mode = 'markers',
            marker = dict(
                size = 10,
                color = 'rgb(76, 182, 170)',
                symbol = 'triangle-down',
                line = dict(
                    width = 0,
                )
            )
        )

        trace2 = go.Scatter(
            x = best_bid.iloc[::1].index,
            y = best_bid.iloc[::1],
            name = 'Best BID',
            mode = 'lines',
            marker = dict(
                size = 5,
                color = '#737CB4',
                symbol = 'line-ew',
                opacity= 1,
                line = dict(
                    width = 1,
                    color = '#737CB4'
                )
            ),
            line = dict(
                    shape = 'hv',
                )
        )

        trace3 = go.Scatter(
            x = best_ask.iloc[::1].index,
            y = best_ask.iloc[::1],
            name = 'Best ASK',
            mode = 'lines',
            marker = dict(
                size = 5,
                color = '#6AD2C5',
                symbol = 'line-ew',
                opacity= 1,
                line = dict(
                    width = 1,
                    color = '#6AD2C5'
                )
            ),
            line = dict(
                    shape = 'hv',
                )

        )

        data = [trace2, trace3, trace0, trace1]

        layout = dict(title = f'{base}/{quot} on {self.stock.upper()}',
                      yaxis = dict(zeroline = False),
                      xaxis = dict(zeroline = False)
                     )

        fig = dict(data=data, layout=layout)
        # plotly.offline.plot(fig, filename='trades') #dont plot