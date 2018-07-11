import requests
import cgi

#getting the form
form = cgi.FieldStorage()

#Default values
layer ="oceanMapping:bathymetry_1m_2"
method = "1"
outFormat="GDAL-XYZ"
xmax= "-66.05632781982423"
ymax="45.25766931485016"
xmin= "-66.05890274047853"
ymin= "45.256460943818134"
band = "GRAY_INDEX"

#getting bbox
xmax= form.getvalue('xmax');
ymax= form.getvalue('ymax');
xmin= form.getvalue('xmin');
ymin= form.getvalue('ymin');

if form.getvalue('resolution'):
	res = form.getvalue('resolution')
	if res=='1':
		layer ="oceanMapping:bathymetry_1m_2"
	if res=='5':
		layer ="oceanMapping:bathymetry_5m_2"
	if res=='10':
		layer ="oceanMapping:bathymetry_10m_2"
	if res=='50':
		layer ="oceanMapping:bathymetry_50m_2"

if form.getvalue('method'):
	met = form.getvalue('method')
	if met =='mean':
		method ="2"
	if met =='bili':
		method ="1"
	if met =='cubic':
		method ="3"

if form.getvalue('format'):
	fom = form.getvalue('format')
	if fom=='ascii':
		outFormat="GDAL-XYZ"
	if fom=='nc':
		outFormat="application/x-netcdf"
	if fom=='geotiff':
		outFormat="image/tiff"
	if fom=='arcgrid':
		outFormat="ArcGrid"
		
		

if form.getvalue('data'):
	fom2 = form.getvalue('data')
	if fom2=='uncertainty':
		band="Band2"
	if fom2=='bathymetry':
		band="GRAY_INDEX"    

urlxyz = "http://131.202.94.74:8080/geoserver/wcs?request=GetCoverage&service=WCS&version=2.0.1&"
urlxyz= urlxyz+"coverageId="+layer+"&Format="+outFormat;
urlxyz = urlxyz+"&subset=http://www.opengis.net/def/axis/OGC/0/Long("+xmin+","+xmax+")"
urlxyz = urlxyz+"&subset=http://www.opengis.net/def/axis/OGC/0/Lat("+ymin+","+ymax+")"
urlxyz = urlxyz+"&subset=http://www.opengis.net/def/axis/OGC/0/method("+method+")"
urlxyz = urlxyz+"&RangeSubset="+band

print 'Content-Type: text/html'

print 'Location: %s' % urlxyz
print # HTTP says you have to have a blank line between headers and content
print '<html>'
print '  <head>'
print '    <meta http-equiv="refresh" content="0;url=%s" />' % urlxyz
print '    <title>You are going to be redirected</title>'
print '  </head>'
print '  <body>'
print '    Redirecting... <a href="%s">Click here if you are not redirected</a>' % urlxyz
print '  </body>'
print '</html>'


