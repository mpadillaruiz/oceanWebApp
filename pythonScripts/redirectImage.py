import requests
import cgi
from PIL import Image
from StringIO import StringIO

#getting the form
form = cgi.FieldStorage()

#getting time query
polygon= form.getvalue('polygon');

layer="";

if form.getvalue('5'):
    layer ="oceanMapping:LowerSJRIVER_50m_4326"

xml = """<?xml version="1.0" encoding="UTF-8"?><wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
  <ows:Identifier>py:try</ows:Identifier>
  <wps:DataInputs>
    <wps:Input>
      <ows:Identifier>raster1</ows:Identifier>
      <wps:Reference mimeType="image/tiff" xlink:href="http://geoserver/wcs" method="POST">
        <wps:Body>
          <wcs:GetCoverage service="WCS" version="1.1.1">
            <ows:Identifier>oceanMapping:LowerSJRIVER_50m_4326</ows:Identifier>
            <wcs:DomainSubset>
              <ows:BoundingBox crs="http://www.opengis.net/gml/srs/epsg.xml#4326">
                <ows:LowerCorner>-66.74021500690543 45.126600581887196</ows:LowerCorner>
                <ows:UpperCorner>-65.14211843429759 45.650018971521824</ows:UpperCorner>
              </ows:BoundingBox>
            </wcs:DomainSubset>
            <wcs:Output format="image/tiff"/>
          </wcs:GetCoverage>
        </wps:Body>
      </wps:Reference>
    </wps:Input>
    <wps:Input>
      <ows:Identifier>line</ows:Identifier>
      <wps:Data>
        <wps:ComplexData mimeType="application/wkt"><![CDATA[POLYGON((-66.10400676727296 45.276637998030466,-66.10400676727296 45.27721177349235,-66.10250473022462 45.27721177349235,-66.10250473022462 45.276637998030466,-66.10400676727296 45.276637998030466))]]></wps:ComplexData>
      </wps:Data>
    </wps:Input>
  </wps:DataInputs>
  <wps:ResponseForm>
    <wps:RawDataOutput mimeType="image/tiff">
      <ows:Identifier>description</ows:Identifier>
    </wps:RawDataOutput>
  </wps:ResponseForm>
</wps:Execute>"""
#print ("Content-Disposition: attachment; filename=image.tiff\r\n\r\n")
headers = {'Content-Type': 'application/xml'} # set what your server accepts
img = requests.post('http://localhost:8080/geoserver/wps', data=xml, headers=headers)

i = Image.open(StringIO(img.content))
croppedImg = i.crop((0,0,1,1))
print croppedImg
#i.save('out.tif')
#i.save("test2.tiff", "TIFF")