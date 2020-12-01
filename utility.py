
import os
import psycopg2
import time



def read_from_csv(f_path, conn, cur):
    
    # function to read from csv to postgres
    # f_path = file path
    # conn = connection to db (provided in main)
    # cur = cursor in db (provided in main)

    # dont dump entire csv --> 10,000 lines
    # or two csv files
    
    print("read from csv into database") 
    
    sql_query = f''' COPY pumpdump(coin, open_time, open, high, low, close, volume)
    FROM '{f_path}'
    DELIMITER ','
    CSV HEADER; '''

    cur.execute(sql_query)
    conn.commit()

def dump_rows(coin, number_of_rows, conn, cur):
    
    # function to dump rows to pumpdump table, data comes from another table with all the data
    # coin = sttring of coin we want to fill pumpdump table with
    # number_of_rows = number of rows we want to dump into pumpdump table
    # conn = connection to db (provided in main)
    # cur = cursor in db (provided in main)
    
    sql_query = f'''INSERT INTO pumpdump SELECT * FROM test_ohlcv WHERE coin='{coin}' LIMIT {number_of_rows};'''
    cur.execute(sql_query)
    conn.commit()

def dump_rows_in_range(coin, from_date, to_date, conn, cur):
    
    # function to dump rows to pumpdump table, data comes from another table with all the data
    # coin = sttring of coin we want to fill pumpdump table with
    # number_of_rows = number of rows we want to dump into pumpdump table
    # conn = connection to db (provided in main)
    # cur = cursor in db (provided in main)

    # example usage = dump_rows
    # dump_rows_in_range()

    sql_query = f''' INSERT INTO pumpdump SELECT * FROM test_ohlcv WHERE open_time>= '{from_date}' and open_time <'{to_date}' AND coin='{coin}';'''
    # INSERT INTO pumpdump SELECT * FROM test_ohlcv WHERE open_time>= '2019-09-25 07:56:00' and open_time <'2019-09-25 11:56:00' AND coin='BNT-BTC';

    cur.execute(sql_query)
    conn.commit()


def clean_up_table(conn,cur):
    # function to truncate the 'pumpdump' table
    sql_query = f'''TRUNCATE pumpdump'''
    cur.execute(sql_query)
    conn.commit()
 

def increment_feed(coin,start_date_time, con, cur):
    # function to incrementally feed data into 'pumpdump' table
    # coin = string of the coin that we want
    # start_date_time = time of the data ie the point from which the data will be fed in live for a particular coin

    while True:
        print("Just submitted query for:", str(start_date_time))
     
        # get the next value
        # if data is not based/sorted on time, limit 1 will not work
        # if data not sroted
        sql_query = f'''INSERT INTO pumpdump SELECT * FROM test_ohlcv WHERE coin='{coin}' AND open_time > '{start_date_time}' LIMIT 1;''' 

        cur.execute(sql_query)
        conn.commit()
        #update the start time
        start_date_query = f'''SELECT open_time FROM pumpdump WHERE coin='{coin}' ORDER BY open_time DESC LIMIT 1;''' 
        cur.execute(start_date_query)
        start_date_time = cur.fetchone()[0]
        time.sleep(5) # Delay for 5 seconds



if __name__ == "__main__":
    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    cur = conn.cursor()

    # usage
    # read_from_csv('/path/to/csv', con, curr)
    # clean_up_table(conn,cur)
    # dump_ rows('RVN-BTC', 10, conn, cur) #limit

    # EXAMPLE 1
    # QSP-BTC @ p_thresh:1.2 & v_thresh: 2 (20%, 200%)
    dump_rows_in_range('QSP-BTC', '2019-03-29 05:00:00', '2019-03-29 07:40:00', conn, cur)
    increment_feed('QSP-BTC','2019-03-29 07:41:00', conn, cur)
    

    # EXAMPLE 2
    # only one pump state shown
    # STORJ-BTC @ p_thresh:1.2 & v_thresh: 2 (20%, 200%) @ anomaly_point: 2019-07-04 17:45:00
    # dump_rows_in_range('STORJ-BTC', '2019-07-04 15:30:00', '2019-07-04 17:40:00', conn, cur)
    # increment_feed('STORJ-BTC', '2019-07-04 17:41:00', conn, cur)

    # EMAPLE 3: Sustained pump
    # STORJ-BTC @ p_thresh:1.1 & v_thresh: 2 (10%, 200%) @ anomaly_point: 2020-02-25 16:15:00
    # dump_rows_in_range('STORJ-BTC', '2020-02-25 14:00:00', '2020-02-25 16:00:00', conn, cur)
    # increment_feed('STORJ-BTC', '2020-02-25 16:01:00', conn, cur)

    conn.close()