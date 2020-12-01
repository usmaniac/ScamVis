
import os
import psycopg2
import time

def clean_up_table(conn,cur):
    # function to truncate the 'pumpdump' table
    sql_query = f'''TRUNCATE pumpdump'''
    cur.execute(sql_query)
    conn.commit()
 
if __name__ == "__main__":
    conn = psycopg2.connect("dbname=scamvis user=postgres password=postgres")
    cur = conn.cursor()
    clean_up_table(conn,cur)
    conn.close()
