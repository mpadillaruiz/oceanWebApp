import cgi
import csv
import shapely
import shapely.wkb
import urllib
import sys
import sysconfig

# Import the necessary packages and modules
import matplotlib.pyplot as plt
import numpy as np

#getting the form
form = cgi.FieldStorage()


#getting time query
z= form.getvalue('zlist');
x= form.getvalue('xlist');

#print rows
#with open('csvfile.csv', "wb") as csv_file:
#    writer = csv.writer(csv_file, delimiter=',')
filename ='lonprofile.csv'
filename = urllib.unquote(filename)

print ("Content-Disposition: attachment; filename="+filename+"\r\n\r\n")

strs = x.replace('[','').split('],')
xxlist = [map(float, s.replace(']','').split(',')) for s in strs]

strs = z.replace('[','').split('],')
zzlist = [map(float, s.replace(']','').split(',')) for s in strs]

with open(filename, "wb") as csv_file:
    writer = csv.writer(csv_file, delimiter=',')

    #Cruise,Station,mon/day/yr,hh:mm,Longitude [degrees_east],Latitude [degrees_north],Bot. Depth [m],DEPTH [m],QF,TEMPERATURE [?C],QF,SALINITY [PSS-78],QF,SOUNDSPEED [m/s],QF
    #id,CruiseName,Instrumentation,TimeStamp,Lng,Lat,BottomDepth,Depth,Temperature,Salinity,SoundSpeed

    #write header
    writer.writerow(["Starting coordinates: "+str(xxlist[0])])
    writer.writerow(["Ending coordinates: "+str(xxlist[len(xxlist)-1])])

    #space
    writer.writerow([])

    #write data
    writer.writerow(["PNumber","Lat","Lon","Depth"])
    i=0
    for x, z in zip(xxlist,zzlist):
        writer.writerow([i,str(x[0]),str(x[1]),str(z[0])])
        i=i+1

file = open(filename,'rb')
print(file.read())


