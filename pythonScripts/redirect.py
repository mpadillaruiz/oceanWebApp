import cgi
from geomet import wkt

#getting the form
form = cgi.FieldStorage()

#getting time query
polygon= form.getvalue('polygon');

#convert it to GeoJSON:
ls_json = wkt.loads(polygon)

xmin= ls_json['coordinates'][0][0][0]
ymin = ls_json['coordinates'][0][0][1]

xmax= ls_json['coordinates'][0][2][0]
ymax = ls_json['coordinates'][0][2][1]

layer="";

if form.getvalue('5'):
    layer ="oceanMapping:LowerSJRIVER_50m_4326"


urlxyz = 'http://localhost:8080/geoserver/ows?service=WCS&version=2.0.1&request=GetCoverage&format=GDAL-XYZ&CRS=EPSG:4326&RESPONSE_CRS=EPSG:4326&width=50&height=50';

#POLYGON((-66.84082031250001 44.74673324024681,-66.84082031250001 45.67548217560647,-65.30273437500001 45.67548217560647,-65.30273437500001 44.74673324024681,-66.84082031250001 44.74673324024681))


redirectURL = urlxyz+"&BBOX="+str(xmin)+","+str(ymin)+","+str(xmax)+","+str(ymax)+"&coverageid="+layer;

print 'Content-Type: text/html'

print 'Location: %s' % redirectURL
print # HTTP says you have to have a blank line between headers and content
print '<html>'
print '  <head>'
print '    <meta http-equiv="refresh" content="0;url=%s" />' % redirectURL
print '    <title>You are going to be redirected</title>'
print '  </head>'
print '  <body>'
print '    Redirecting... <a href="%s">Click here if you are not redirected</a>' % redirectURL
print '  </body>'
print '</html>'