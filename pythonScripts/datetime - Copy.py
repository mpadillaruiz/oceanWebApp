print ("Content-Disposition: attachment; filename=weather_data.csv\r\n\r\n")

import cgi
import psycopg2
import csv

#connection to the database
conn = psycopg2.connect("host=localhost dbname=oceanMapping user=postgres password=admin")
cur = conn.cursor()

#getting the form
form = cgi.FieldStorage()

#getting time query
startdate= form.getvalue('startdate');
enddate= form.getvalue('enddateinput');
starttime = form.getvalue('starttime')
endtime = form.getvalue('endtime')

timestamp1=startdate+' '+starttime+':00'
timestamp2=enddate+' '+endtime+':00'

#array for data
arrayData=[]
header=[]

if form.getvalue('Temp(C)'):
    arrayData.append('temperature')
    header.append('Temp(C)')
if form.getvalue('DewPointTemp(C)'):
    arrayData.append('dewtemperature')
    header.append('DewPointTemp(C)')
if form.getvalue('RelHum(%)'):
    arrayData.append('relhumidity')
    header.append('RelHum(%)')
if form.getvalue('WindDir(10sdeg)'):
    arrayData.append('winddirection')
    header.append('WindDir(10sdeg)')
if form.getvalue('WindSpd(km/h)'):
    arrayData.append('windspeed')
    header.append('WindSpd(km/h)')
if form.getvalue('Visibility(km)'):
    arrayData.append('visibility')
    header.append('Visibility(km)')
if form.getvalue('StnPress(kPa)'):
    arrayData.append('stnpressure')
    header.append('StnPress(kPa)')
if form.getvalue('Hmdx'):
    arrayData.append('hmdx')
    header.append('Hmdx')
if form.getvalue('WindChill'):
    arrayData.append('windchill')
    header.append('WindChill')
if form.getvalue('Weather'):
    arrayData.append('weather')
    header.append('Weather')

#select structure
select ='SELECT timestamp'
headertext='timestamp'

for data in arrayData:
    select =select+', '+data
select = select +" FROM weather WHERE timestamp >= '"+timestamp1+"' AND timestamp < '"+timestamp2 +"'"

for data in header:
    headertext = headertext+','+data

cur.execute(
            select
        )
#rows = cur.fetchone()
#print file
print(headertext)
#print rows
for row in cur:
    i=0
    for element in row:
        if i==0:
            string = str(element)+','
            print string,
        elif i==len(row)-1:
            print element
        else:
            string=str(element)
            string=string+','
            print string,
        i=i+1
conn.commit()