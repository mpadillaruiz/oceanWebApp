$(document).ready(function () {

	//Function to prepare the nav toolbar and disable it
	$('#sidenavToggler').click();
	$('#sidenavToggler')[0].classList.add('inactiveLink');

	//Set on click event for area button (It will go back to previous page to re-select the area of interest
	document.getElementById("areaButton").addEventListener("click", function(){
		var x=window.confirm("Are you sure you want to change your Area of Interest?")
		if (x){
			localStorage.setItem("nohelp",true);
			location.href = "areaSelection.html";}
	});

});

//Constants for the layer names
const adcpName = "adcp_points";
const adcpPolName = "adcp_polygons";
//const mvpName = "mvp_points";
const mvpName = "mvp_polygons_date";
const footprintsName = "bagfootprints";

//Variable to store the content of the interaction panel
var keepresult='';

//Variable to keep active marker (drawing)
var marker;

//Variable to keep layers active

//Old layers
//var allLayers=["mvp_points","ortho","footprints","weatherStations","hydrometricStations","buoys","adcp","bathy","uncertainty","coast","tidalStations"];
//New layers
var allLayers=["mvp_points","survey","adcp_points","surveyadcp","ortho","footprints","weatherStations","hydrometricStations","buoys","bathy","uncertainty","coast","tidalStations"];

var activeLayers=[];

//Variables to keep the queried year/month/year
var queriedYear='0';
var queriedMonth='0';
var queriedDay='0';


// Map configuration
var map = L.map('tiled-map',{
	preferCanvas: true
});

//Get the Bounds from the area selected in the previous page (using local storage)
var southWest = L.latLng(parseFloat(localStorage.getItem("sw_lat")), parseFloat(localStorage.getItem("sw_lng"))),
	northEast = L.latLng(parseFloat(localStorage.getItem("ne_lat")), parseFloat(localStorage.getItem("ne_lng"))),
    bounds = L.latLngBounds(southWest, northEast);

//Set the map bounds
map.fitBounds(bounds);

//Deleted to not to restrict it to the area
//Set max bounds to the area selected
//map.setMaxBounds(bounds);

//Set min zoom to the area selected
//map.setMinZoom(zoom);$("#popup").hide().fadeIn(200);

//set the zoom
var zoom = map.getZoom();$("#popup").hide().fadeIn(200);
zoom=zoom-1;

// create a gray rectangle to represent the area selected
L.rectangle(bounds, {color: "#6A6462", weight: 0.5, fillOpacity:0.05,clickable:false,interactive:false}).addTo(map);

//Create base maps (More basemaps could easily be added
var basemaps = {
	'Basic': stamenBasemap().addTo(map),
    //'Blank': blank(),
	'Ocean':esriBasemap("Oceans").addTo(map),
	'Topographic':esriBasemap("Topographic").addTo(map),
	'Satellite Image':esriBasemap("Imagery").addTo(map),
	//'Terrain':basemapTerrain().addTo(map)
};

//Function to add a stamen base map
function stamenBasemap() {
    var attr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.';
    return L.tileLayer("http://tile.stamen.com/toner-background/{z}/{x}/{y}.png", {
        opacity: 0.1,
        attribution: attr
    });
}
//Function to add an esri basemap passing the value of the basemap
function esriBasemap(value) {
    return L.esri.basemapLayer(value);
}

//Functions to add more basemaps (uncomment if needed)
/*function basemapTerrain(){
 return L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
 });
}

function blank() {
    var layer = new L.Layer();
    layer.onAdd = layer.onRemove = function() {};
    return layer;
}*/


// Create layer control for the map
var layer_control =L.control.layers(basemaps,null,{sortlayers:true}).addTo(map);
//Set the control width to auto to adjust to incomming (longer) layers
 $('.leaflet-control-layers').css({ 'width': 'auto', 'float': 'left' });

//Create controls for legends
var uri = "http://131.202.94.74:8080/geoserver/wms?";
		uri += "SERVICE=WMS&VERSION=1.3.0&SLD_VERSION=1.1.0&";
		uri += "REQUEST=GetLegendGraphic&FORMAT=image/jpeg&LAYER=oceanMapping:LowerSJRIVER_50m_Bilinear3&STYLE=";
var bathyLegend = L.wmsLegend(uri);
bathyLegend.remove();

//Create controls for legends
var pointsLegend = L.control({position: 'bottomright'});
pointsLegend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = ["Winter", "Spring", "Summer", "Fall"],
    colors = ["#008080","#79ce57","#d0975d","#d72215"];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors[i] + '"></i> ' +
            grades[i]+ '<br><br>';

}

return div;
};

// Initialise the FeatureGroup to store editable layers
var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

//Adding measuring tool to the map
var measureControl = L.control.measure({
  position: 'topleft',
	primaryLengthUnit: 'meters',
	secondaryLengthUnit: 'feet',
	primaryAreaUnit: 'sqmeters',
	secondaryAreaUnit: 'hectares',
	activeColor: '#2378A9',
	completedColor: '#2da0e2'
});
measureControl.addTo(map);



//Drawing options
var drawPluginOptions = {
	position: 'topleft',
	draw: {
		rectangle: {
			allowIntersection: false, // Restricts shapes to simple polygons
			drawError: {
			color: '#e1e100', // Color the shape will turn when intersects
			message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
			},
			shapeOptions: {
				color: '#e1e100'
			}
		},
		// disable toolbar item by setting it to false
		circlemarker:false,
		polyline:false,
		circle: false,
		polygon: false,
		rectangle: false
		},
	edit: {
		featureGroup: editableLayers //REQUIRED!!
	}
};

//Adding drawing control to the map
map.addControl(new L.Control.Draw(drawPluginOptions));

//Variable to know if drawing tool is active or not
var drawing = false;
map.on('draw:drawstart',function(e){
	drawing=true;

});
map.on('draw:drawstop',function(e){
	drawing=false;

});
//Function when creating a drawing
map.on('draw:created', function(e) {
	var choicePopUp = L.popup();
	var type = e.layerType,
		layer = e.layer;
	var geometry;
	var downloadButton;
	var statsButton;

	switch (type){
		case ("polygon"):
			geometry = poly2WKT(layer);
			if (map.hasLayer(bathy)){
				//downloadButton = '<a target="_blank" href='+urlxyz+'>Download Data in ASCII</a>'
			}
			else{
				downloadButton = '<form target="_blank" name="downloadProfile" action="pythonScripts/profilegeoquery.py" method="post"><input type="hidden" name="polygon" value="'+geometry+'"><input type="hidden" name="year" value="'+queriedYear+'"><input type="hidden" name="day" value="'+queriedDay+'"><input type="hidden" name="month" value="'+queriedMonth+'"><input type="submit" value="Download Profile" class="btn btn-primary"></form>'
			}
			break;
		case ("polyline"):
			geometry = line2WKT(layer);
			console.log(geometry);
			downloadButton='<form target="_blank" name="Bathy" action="calculateProfile3.py" method="get"><input type="hidden" name="polygon" value="'+geometry+'"><input type="submit" value="Generate Profile" class="btn btn-primary"></form>';
			//downloadButton='Geometry: '+geometry;
			break;
		case ("rectangle"):
			geometry = poly2WKT(layer);
			var xmin = layer._bounds._southWest.lng.toString();
			var xmax= layer._bounds._northEast.lng.toString();
			var ymin= layer._bounds._southWest.lat.toString();
			var ymax= layer._bounds._northEast.lat.toString();

			if (map.hasLayer(ortho)){
				var bbox = xmin+","+ymin+","+xmax+","+ymax;
				var coverageid = "oceanMapping:orthocombined4326";
				var urlll= urlgtiff+'&BBOX='+xmin+','+ymin+','+xmax+','+ymax+'&CRS=EPSG:4326&RESX=0.000010905586241&RESY=0.000010905586241&COVERAGE='+coverageid;
				console.log(urlll)
				downloadButton= '<a target="_blank" href=\orthophotos>Download Data in MrSID</a><a style="margin-left:20px" target="_blank" href='+urlll+'>Download Data in GeoTiff</a>';
			}
			else if (map.hasLayer(coast)){
				var bbox = xmin+","+ymin+","+xmax+","+ymax;
				var coverageid = "oceanMapping:coastlines3";
				var kml= urlWFS+coverageid+'&BBOX='+xmin+','+ymin+','+xmax+','+ymax+'&CRS=EPSG:4326&outputFormat=kml';
				var csv= urlWFS+coverageid+'&BBOX='+xmin+','+ymin+','+xmax+','+ymax+'&CRS=EPSG:4326&outputFormat=csv';
				downloadButton= '<a target="_blank" href='+kml+'&CRS=EPSG:4326>Download Data in KML</a><a style="margin-left:20px" target="_blank" href='+csv+'>Download Data in CSV</a>';
			}
			else{

				statsButton='<form target="_blank" name="statsBathy" action="pythonScripts/calculateStats.py" method="get"><input type="hidden" name="polygon" value="'+geometry+'"><input type="submit" value="Compute Statistics" class="btn btn-primary"></form></br>';
				downloadButton='<form target="_blank" name="downloadBathy" action="pythonScripts/downloadRaster.py" method="get"><b>Select the resolution:</b> </br><input type="hidden" name="ymin" value="'+ymin+'"><input type="hidden" name="xmin" value="'+xmin+'"><input type="hidden" name="ymax" value="'+ymax+'"><input type="hidden" name="xmax" value="'+xmax+'"><input type="radio" style="margin-right:5px" name="resolution" value="1">1m<input type="radio" style="margin-right:5px" name="resolution" value="5">5m<input type="radio" style="margin-left:5px;margin-right:5px" name="resolution" value="10">10m<input style="margin-left:5px;margin-right:5px" type="radio" name="resolution" value="50">50m</br><b>Select the method used to simplify depths:</b></br><input type="radio" style="margin-right:5px" name="method" value="mean">Mean<input type="radio" style="margin-right:5px" name="method" value="bili">Bilinear<input style="margin-left:5px;margin-right:5px" type="radio" name="method" value="cubic">Cubic</br><b>Select the data:</b></br><input type="radio" style="margin-right:5px" name="data" value="bathymetry">Bathymetry<input style="margin-left:5px;margin-right:5px" type="radio" name="data" value="uncertainty">Uncertainty</br><b>Select the format:</b></br><input type="radio" style="margin-right:5px" name="format" value="nc">netCDF<input style="margin-left:5px;margin-right:5px" type="radio" name="format" value="ascii">ascii<input style="margin-left:5px;margin-right:5px" type="radio" name="format" value="geotiff">GeoTIFF<input style="margin-left:5px;margin-right:5px" type="radio" name="format" value="arcgrid">ArcGrid</br></br><input type="submit" value="Download Data" class="btn btn-primary"></form>';

				downloadButton=statsButton+downloadButton;
			//downloadButton='Geometry: '+geometry;
			}
			break;
		case ("marker"):
			marker = layer;
			downloadButton="<div id='customMarker'></div>";
			$('#myModal').modal('show');
			document.getElementById("ModalGraph").innerHTML ='<textarea id="popupText" cols="40" rows="5"></textarea>';
			document.getElementById("ModalTitle").innerHTML ='Enter information for the marker';
			document.getElementById("closeModalBtn").innerHTML='Enter';
			document.getElementById("closeModalBtn").onclick = function() {
				marker.closePopup();
				var newPopup = L.popup();
				var txt = document.getElementById("popupText").value;
				newPopup.setContent(txt);
				marker.bindPopup(newPopup).openPopup();;
			};

		}

	choicePopUp.setContent(downloadButton);
	layer.bindPopup(choicePopUp);

	editableLayers.addLayer(layer);
	layer.openPopup();

	map.dragging.enable();

});

vertexCounter=0;

//Deleted in order to allow multipoints profiles
/*map.on('draw:drawvertex', function(e) {
		vertexCounter=vertexCounter+1;
		if(vertexCounter==2){
			// Cancel drawing
			try{
				myPolylineDrawHandler._fireCreatedEvent();
				myPolylineDrawHandler.disable();
				vertexCounter=0;
			}
			catch (err){

			}
		}

	//}

});*/

//Printing map controls
L.easyPrint({
	title: 'Print map',
	position: 'topleft',
	sizeModes: ['Current','A4Portrait', 'A4Landscape']
}).addTo(map);//Adding measuring tool to the map
var measureControl = L.control.measure({
  position: 'topleft',
	primaryLengthUnit: 'meters',
	secondaryLengthUnit: 'feet',
	primaryAreaUnit: 'sqmeters',
	secondaryAreaUnit: 'hectares',
	activeColor: '#2378A9',
	completedColor: '#2da0e2'
});
measureControl.addTo(map);



//Drawing options
var drawPluginOptions = {
	position: 'topleft',
	draw: {
		rectangle: {
			allowIntersection: false, // Restricts shapes to simple polygons
			drawError: {
			color: '#e1e100', // Color the shape will turn when intersects
			message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
			},
			shapeOptions: {
				color: '#e1e100'
			}
		},
		// disable toolbar item by setting it to false
		circlemarker:false,
		polyline:false,
		circle: false,
		polygon: false,
		rectangle: false
		},
	edit: {
		featureGroup: editableLayers //REQUIRED!!
	}
};

//Adding drawing control to the map
map.addControl(new L.Control.Draw(drawPluginOptions));

//Variable to know if drawing tool is active or not
var drawing = false;
map.on('draw:drawstart',function(e){
	drawing=true;

});
map.on('draw:drawstop',function(e){
	drawing=false;

});
//Function when creating a drawing
map.on('draw:created', function(e) {
	var choicePopUp = L.popup();
	var type = e.layerType,
		layer = e.layer;
	var geometry;
	var downloadButton;
	var statsButton;

	switch (type){
		case ("polygon"):
			geometry = poly2WKT(layer);
			if (map.hasLayer(bathy)){
				//downloadButton = '<a target="_blank" href='+urlxyz+'>Download Data in ASCII</a>'
			}
			else{
				downloadButton = '<form target="_blank" name="downloadProfile" action="pythonScripts/profilegeoquery.py" method="post"><input type="hidden" name="polygon" value="'+geometry+'"><input type="hidden" name="year" value="'+queriedYear+'"><input type="hidden" name="day" value="'+queriedDay+'"><input type="hidden" name="month" value="'+queriedMonth+'"><input type="submit" value="Download Profile" class="btn btn-primary"></form>'
			}
			break;
		case ("polyline"):
			geometry = line2WKT(layer);
			console.log(geometry);
			downloadButton='<form target="_blank" name="Bathy" action="calculateProfile3.py" method="get"><input type="hidden" name="polygon" value="'+geometry+'"><input type="submit" value="Generate Profile" class="btn btn-primary"></form>';
			//downloadButton='Geometry: '+geometry;
			break;
		case ("rectangle"):
			geometry = poly2WKT(layer);
			var xmin = layer._bounds._southWest.lng.toString();
			var xmax= layer._bounds._northEast.lng.toString();
			var ymin= layer._bounds._southWest.lat.toString();
			var ymax= layer._bounds._northEast.lat.toString();

			if (map.hasLayer(ortho)){
				var bbox = xmin+","+ymin+","+xmax+","+ymax;
				var coverageid = "oceanMapping:orthocombined4326";
				var urlll= urlgtiff+'&BBOX='+xmin+','+ymin+','+xmax+','+ymax+'&CRS=EPSG:4326&RESX=0.000010905586241&RESY=0.000010905586241&COVERAGE='+coverageid;
				console.log(urlll)
				downloadButton= '<a target="_blank" href=\orthophotos>Download Data in MrSID</a><a style="margin-left:20px" target="_blank" href='+urlll+'>Download Data in GeoTiff</a>';
			}
			else if (map.hasLayer(coast)){
				var bbox = xmin+","+ymin+","+xmax+","+ymax;
				var coverageid = "oceanMapping:coastlines3";
				var kml= urlWFS+coverageid+'&BBOX='+xmin+','+ymin+','+xmax+','+ymax+'&CRS=EPSG:4326&outputFormat=kml';
				var csv= urlWFS+coverageid+'&BBOX='+xmin+','+ymin+','+xmax+','+ymax+'&CRS=EPSG:4326&outputFormat=csv';
				downloadButton= '<a target="_blank" href='+kml+'&CRS=EPSG:4326>Download Data in KML</a><a style="margin-left:20px" target="_blank" href='+csv+'>Download Data in CSV</a>';
			}
			else{

				statsButton='<form target="_blank" name="statsBathy" action="pythonScripts/calculateStats.py" method="get"><input type="hidden" name="polygon" value="'+geometry+'"><input type="submit" value="Compute Statistics" class="btn btn-primary"></form></br>';
				downloadButton='<form target="_blank" name="downloadBathy" action="pythonScripts/downloadRaster.py" method="get"><b>Select the resolution:</b> </br><input type="hidden" name="ymin" value="'+ymin+'"><input type="hidden" name="xmin" value="'+xmin+'"><input type="hidden" name="ymax" value="'+ymax+'"><input type="hidden" name="xmax" value="'+xmax+'"><input type="radio" style="margin-right:5px" name="resolution" value="1">1m<input type="radio" style="margin-right:5px" name="resolution" value="5">5m<input type="radio" style="margin-left:5px;margin-right:5px" name="resolution" value="10">10m<input style="margin-left:5px;margin-right:5px" type="radio" name="resolution" value="50">50m</br><b>Select the method used to simplify depths:</b></br><input type="radio" style="margin-right:5px" name="method" value="mean">Mean<input type="radio" style="margin-right:5px" name="method" value="bili">Bilinear<input style="margin-left:5px;margin-right:5px" type="radio" name="method" value="cubic">Cubic</br><b>Select the data:</b></br><input type="radio" style="margin-right:5px" name="data" value="bathymetry">Bathymetry<input style="margin-left:5px;margin-right:5px" type="radio" name="data" value="uncertainty">Uncertainty</br><b>Select the format:</b></br><input type="radio" style="margin-right:5px" name="format" value="nc">netCDF<input style="margin-left:5px;margin-right:5px" type="radio" name="format" value="ascii">ascii<input style="margin-left:5px;margin-right:5px" type="radio" name="format" value="geotiff">GeoTIFF<input style="margin-left:5px;margin-right:5px" type="radio" name="format" value="arcgrid">ArcGrid</br></br><input type="submit" value="Download Data" class="btn btn-primary"></form>';

				downloadButton=statsButton+downloadButton;
			//downloadButton='Geometry: '+geometry;
			}
			break;
		case ("marker"):
			marker = layer;
			downloadButton="<div id='customMarker'></div>";
			$('#myModal').modal('show');
			document.getElementById("ModalGraph").innerHTML ='<textarea id="popupText" cols="40" rows="5"></textarea>';
			document.getElementById("ModalTitle").innerHTML ='Enter information for the marker';
			document.getElementById("closeModalBtn").innerHTML='Enter';
			document.getElementById("closeModalBtn").onclick = function() {
				marker.closePopup();
				var newPopup = L.popup();
				var txt = document.getElementById("popupText").value;
				newPopup.setContent(txt);
				marker.bindPopup(newPopup).openPopup();;
			};

		}

	choicePopUp.setContent(downloadButton);
	layer.bindPopup(choicePopUp);

	editableLayers.addLayer(layer);
	layer.openPopup();

	map.dragging.enable();

});

vertexCounter=0;

//Deleted in order to allow multipoints profiles
/*map.on('draw:drawvertex', function(e) {
		vertexCounter=vertexCounter+1;
		if(vertexCounter==2){
			// Cancel drawing
			try{
				myPolylineDrawHandler._fireCreatedEvent();
				myPolylineDrawHandler.disable();
				vertexCounter=0;
			}
			catch (err){

			}
		}

	//}

});*/

//Printing map controls
L.easyPrint({
	title: 'Print map',
	position: 'topleft',
	sizeModes: ['Current','A4Portrait', 'A4Landscape']
}).addTo(map);

//WMS sources (two are created to set different feature infos, although it could be programmed only in one)
//Initialize WMS source with geoserver url for points data
var MySourcePoints = L.WMS.Source.extend({

    'showFeatureInfo': function(latlng, info) {


		if(drawing==false){
		var popup = new L.Popup();


		popup.setLatLng(latlng);
		if(map.hasLayer(bathy)){
		if(queriedDepth!="" &&queriedDepth!=null){
		popup.setContent(queriedDepth);
		map.openPopup(popup);
		}}
		try{

		var id =info.features[0].id.split(".");
		if(id[0]=="bagfootprints"){
			if(map.hasLayer(bathy)||map.hasLayer(footprints)){
			var timestamp = info.features[0].properties.datestring;
			var year = timestamp.substring(0,4);
			var popupContent = "Latitude: "+latlng.lat+"</br>Longitude: "+latlng.lng+"</br>"+queriedDepth+"</br>Campaign: "+JSON.stringify(info.features[0].properties.campaign)+"</br>Date: "+JSON.stringify(info.features[0].properties.datestring);
			popupContent = popupContent+"</br>Vessel: "+info.features[0].properties.vessel+" </br> Sensor: "+info.features[0].properties.sensor;
			popupContent = popupContent+"</br><a target=\"_blank\" href=\""+info.features[0].properties.metadata+"\">Metadata</a>";
			popup.setContent(popupContent)


			map.openPopup(popup);}
		}
		else{
		var id2 =id[1];

		var timestamp = info.features[0].properties.timestamp;
		var year = timestamp.substring(0,4);
		var month = parseInt(timestamp.substring(5,7));
		var day = parseInt(timestamp.substring(8,10));

		if (isNaN(queriedDay)&& isNaN(queriedMonth)){
			if (year==queriedYear){

			if (info.features[0].id.includes('adcp')){

				popupADCP();
			}

			else if (info.features[0].id.includes('mvp_points')){
				popupMVP(popup,latlng,info);
			}
			}
		}
		else if (isNaN(queriedDay)){
			if (year==queriedYear && month==queriedMonth){

			if (info.features[0].id.includes('adcp')){

				popupADCP();
			}

			else if (info.features[0].id.includes('mvp_points')){
				popupMVP();
			}
			}
		}
		else{
			if (year==queriedYear && month==queriedMonth&& day==queriedDay){

			if (info.features[0].id.includes('adcp')){
					popupADCP();
			}

			else if (info.features[0].id.includes('mvp_points')){
				popupMVP();
			}
		}
		}}

		}catch(err){

		}
		}
		function popupADCP(){
			popup.setLatLng(latlng);
			popup.setContent(JSON.stringify(info.features[0].properties.campaign)+JSON.stringify(info.features[0].properties.timestamp));
			map.openPopup(popup);
}

		function popupMVP(){
			popup.setLatLng(latlng);

			var cruise = JSON.stringify(info.features[0].properties.cruisename);
			var timestamp = JSON.stringify(info.features[0].properties.timestamp);
			var instrumentation = JSON.stringify(info.features[0].properties.instrumentation);

			var profileButton = '<form data-toggle="modal" data-target="#myModal" action="profile.py" method="get"><input type="hidden" name="id" value="'+id2+'"><input type="submit" value="Generate vertical profile" class="btn btn-primary"></form>';

			popup.setContent("Latitude: "+latlng.lat+"</br>Longitude: "+latlng.lng+"</br>Cruise Name: "+cruise+"</br>Instrumentation: "+instrumentation+"</br>Recording time: "+timestamp+"</br></br>"+profileButton);
			map.openPopup(popup);
		}

	},
	'parseFeatureInfo': parseJSON
});



var queriedDepth;
//Initialize WMS source with geoserver url for bathymetry
var MySourceBath = L.WMS.Source.extend({

    'showFeatureInfo': function(latlng, info) {

		if(map.hasLayer(bathy)){
		var popup = new L.Popup();
		//var id =info.features[0].id.split(".")[1];
		var depth = info.features[0].properties.GRAY_INDEX;
		if(drawing==false){
		if (depth!=1000000){

			popup.setLatLng(latlng);
			queriedDepth="Depth: "+depth.toFixed(3);
			popup.setContent(queriedDepth);
			map.openPopup(popup);

		}	else{queriedDepth="";}}

    }},
	'parseFeatureInfo':parseJSON
});

//Function to parse a JSON result
function parseJSON(result, url) {
	var obj;
    if (result == "error") {
        // AJAX failed, possibly due to CORS issues.
        obj = "Cors error: " + url;
	}
	else{
		obj = JSON.parse(result);
	}
    return obj;
}

/*

// Add WMS source for pointsadcp_points
var source = new MySourcePoints(
    "http://131.202.94.74:8080/geoserver/wms",
    {
		"format": "image/png",
        "transparent": "true",
		"version": "1.3.0",
        "info_format": "application/json",
        "tiled": true,
		"maxZoom":20,
		"time":"1990/2020"
    }
);*/

// Add WMS source/layers for bathymetry
var source2 = new MySourceBath(
    "http://131.202.94.74:8080/geoserver/wms",
    {
		"format": "image/png",
        "transparent": "true",
		"version": "1.3.0",
        "info_format": "application/json",
		"tiled": true,
		"maxZoom":20
    }
);


// Add WMS source for points in the new geoserver. I should prepare a LWMS Extended class to handle feature info
var source3 = new L.WMS.Source(
    "http://localhost:8080/geoserver/wms",
    {
		"format": "image/png",
        "transparent": "true",
				"version": "1.3.0",
        "info_format": "application/json",
        "tiled": true,
		"maxZoom":20,
		"time":"1990/2020"
    }
);

//Get the layers from the source (WMS LAYERS)
//ADCP Points
var adcp_points=source3.getLayer("oceanMapping:adcp_points");
//var adcp_polygons=source3.getLayer("oceanMapping:adcp_polygons");
//MVP Points
var mvp_points=source3.getLayer("oceanMapping:mvp_points");
//var mvp_polygons=source3.getLayer("oceanMapping:mvp_polygons");
//Footprints for the bathymetry
var footprints=source2.getLayer("oceanMapping:bagfootprints");
//Background bathymetry
//var bathymetry=source2.getLayer("oceanMapping:LowerSJRIVER_50m_Bilinear3");
var bathymetry=source2.getLayer("oceanMapping:pyramids5");
var uncertainty=source2.getLayer("oceanMapping:bathymetry_50m_2");
//Hillshading for the bathymetry
var hillshading=source2.getLayer("oceanMapping:LowerSJRIVER_5m_Bilinear_20091001_hs3");
//Orthophotographs
var ortho=source2.getLayer("oceanMapping:sj_ortho2");
//Coast Lines
var coast=source2.getLayer("oceanMapping:coastlines3");

//Feature group for the layers related to bathymetry
var bathy = L.layerGroup([ bathymetry,hillshading]);

//Create vector layers (GEOJSON)
var weatherStations = new L.GeoJSON(
    null, {
        onEachFeature: onEachFeatureWeather
    });

var hydrometricStations = new L.GeoJSON(
    null, {
        onEachFeature: onEachFeatureWater
    });

var buoys = new L.GeoJSON(
    null, {
        onEachFeature: onEachFeaturebuoys
    });

var tidalStations = new L.GeoJSON(
    null, {
        onEachFeature: onEachFeaturetidal
    });

//MVP SURVEYS GEOJSON
var survey = new L.GeoJSON(
    null, {
        onEachFeature: pop_Surveys,
		style:style_Surveys
    });

//ADCP SURVEYS GEOJSON
var surveyadcp = new L.GeoJSON(
  null, {
    onEachFeature: pop_Surveys2,
		style:style_Surveys
});

//map.addLayer(adcp);
//map.addLayer(adcp_polygons);
//map.addLayer(mvp_polygons);

//Geoserver end point for WFS (new Geoserver)
var wfsURL = 'http://localhost:8080/geoserver/wfs';
//Geoserver end point for WFS (old Geoserver)
var wfsURLold = 'http://131.202.94.74:8080/geoserver/wfs';

//Getting the bbox variable for the wfs requests (which maches the map bounds selected)
var bboxvar =bounds.toBBoxString();

//Variables to store project names and dates. Layers will contain each polygon to show it on the map
var names=[];
var dates=[];
var n = 0;
var layers=[];

//Variables to store project names and dates. Layers will contain each polygon to show it on the map
var namesADCP=[];
var datesADCP=[];
var n2 = 0;
var layersADCP=[];

//Load survey polygons
loadwfs2("oceanMapping:mvp_polygons_dateend");
loadwfs2("oceanMapping:adcp_polygons");

//Function that creates check boxes dinamically
function createCheckBox (value){
	var string  = '<span style="margin-left:10px" name="'+value+'">'+value+'</span>';
	return string;
}

//Variables to handle time (Time is extracted from the getCapabilities document of geoserver)
var times=[];

var startyearadcp="";
var startyearadcpPol="";
var startyearmvp_points="";

var endyearadcp="";
var endyearmvp_points="";
var endyearadcpPol="";

var timeadcp;
var timemvp_points;

//Perform 'GetCapabilities' request to the source (new Geoserver)
source3._overlay.getCapabilities({
//adcp._source._overlay.getCapabilities({

	done: function(capabilities) {
  //Read the times for every layer from the get capabilities document (layer -> Dimension)
  //Store the results in the times array

	//Getting all the layers available
		var layersXML = capabilities.childNodes[1].childNodes[2].getElementsByTagName("Layer");

		//Iterate for each layer
		for (i=0;i<layersXML.length;i++){
			var name = layersXML[i].childNodes[9].nodeName;
			//Time is stored in the Dimension tag
			if (name=="Dimension"){
				var arrayTime = [];
				arrayTime.push(layersXML[i].childNodes[0].innerHTML);
				arrayTime.push(layersXML[i].childNodes[9].innerHTML);
				//Times array (two dimensional) store all the times available for every layer (layer name, time)
				times.push(arrayTime);
			}
		}

		//Extracting times for each layer
		timeadcp=extractTime(adcpName);
		timeadcpPol=extractTime(adcpPolName);
		//This one is for mvp polygons
		timemvp_points=extractTime(mvpName);
	//	timebath=extractTime(footprintsName);

		//Extract starting/ending years
		startyearadcp = timeadcp[0].getFullYear();
		startyearadcpPol = timeadcpPol[0].getFullYear();
		startyearmvp_points = timemvp_points[0].getFullYear();

	//	startyearbath = timebath[0].getFullYear();
		endyearadcp = timeadcp[timeadcp.length-1].getFullYear();
		endyearadcpPol = timeadcpPol[timeadcpPol.length-1].getFullYear();
		endyearmvp_points = timemvp_points[timemvp_points.length-1].getFullYear();
	//	endyearbath = timebath[timebath.length-1].getFullYear();

		//Make links active now
		for (i=1;i<10;i++){
			$('#link'+i+'')[0].classList.remove('inactiveLink');
		}

		//Stop loader
		$("#popup").fadeOut(200);

	},
	fail: function(errorThrown) {
		console.log('getCapabilitiesfailed: ', errorThrown);
	},
	always: function() {
		console.log('getCapabilitiesfinished');
	}
});

//Function that extract times from the times array given a layer name
function extractTime(layername){
	//Adding the namespace
	var name = "oceanMapping:"+layername;
	var time;
	for (i=0;i<times.length;i++){
		if(times[i][0]==name){
			time=times[i][1];
			time = time.split(",");
			for (i=0;i<time.length;i++){
				time[i] = time[i].slice(0, 10);
				var date = new Date(time[i]);
				var userTimezoneOffset = date.getTimezoneOffset() * 60000;
				time[i] = new Date(date.getTime() + userTimezoneOffset);
			}
		}
	}
	return time;
}

//Function to open the interaction panel
function openbigtab() {

	$('#tiled-map')[0].classList.add('map-wrapper');
	$('#accordion')[0].classList.add('panel-wrapper');
	$('#arrow-icon')[0].classList.add('fa-angle-down');

	$('#tiled-map')[0].classList.remove('map-nowrapper');
	$('#accordion')[0].classList.remove('panel-nowrapper');
	$('#arrow-icon')[0].classList.remove('fa-angle-up');

	}

//Function to close the interaction panel
function closetab() {

	$('#tiled-map')[0].classList.add('map-nowrapper');
	$('#accordion')[0].classList.add('panel-nowrapper');
	$('#arrow-icon')[0].classList.add('fa-angle-up');


	$('#tiled-map')[0].classList.remove('map-wrapper');
	$('#accordion')[0].classList.remove('panel-wrapper');
	$('#tiled-map')[0].classList.remove('map-wrapper2');
	$('#accordion')[0].classList.remove('panel-wrapper2');
	$('#arrow-icon')[0].classList.remove('fa-angle-down');

}

//Function to open the interaction panel
function opensmalltab() {

	$('#tiled-map')[0].classList.add('map-wrapper2');
	$('#accordion')[0].classList.add('panel-wrapper2');
	$('#arrow-icon')[0].classList.add('fa-angle-down');

	$('#tiled-map')[0].classList.remove('map-nowrapper');
	$('#accordion')[0].classList.remove('panel-nowrapper');
	$('#arrow-icon')[0].classList.remove('fa-angle-up');

}


//Functions to enable layers (layernameActive)
function bathymetryActive(){

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("bathy");

	if (index > -1) {
		activeLayers.splice(index, 1);
	}
	index = activeLayers.indexOf("footprints");
	if (index > -1) {
		activeLayers.splice(index, 1);
	}
	index = activeLayers.indexOf("uncertainty");
		if (index > -1) {map.addLayer(uncertainty);
		activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(1);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	//Create form for the interaction panel
	document.getElementById("accordionText").innerHTML =createForm('bathy');

	//Create the slider for the years
	var slider = document.getElementById("myRangebath");
	var output = document.getElementById("valuebath");
	output.innerHTML = slider.value;
	slider.oninput = function() {
		queriedYear=this.value;
		output.innerHTML = this.value;
		//Change the time of the WMS when the slider value changes
		footprints._source._overlay.setParams({time: this.value});
	}

	//Open the interaction panel
	opensmalltab();

	map.addLayer(uncertainty);
	map.addLayer(bathy);
	map.addLayer(footprints);


	layer_control.addOverlay(bathy, "Bathymetry");
	layer_control.addOverlay(uncertainty, "Uncertainty");
	layer_control.addOverlay(footprints, "Surveys");

	pointsLegend.remove();
	bathyLegend.addTo(map);

	layer_control._update();
	layer_control.expand();
}

function MVPActive(){

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("mvp_points");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(2);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsADCP();
	removePolygonsMVP();

	//Create form for the interaction panel
	document.getElementById("accordionText").innerHTML =createForm("mvp_points");

	$( "#slider-4" ).slider({
							 range:true,
							 min: startyearmvp_points,
							 max: endyearmvp_points,
							 values: [ startyearmvp_points,endyearmvp_points ],
							 slide: setLayers2

						});
	$( "#price2" ).val( $( "#slider-4" ).slider( "values", 0 ) +" - " + $( "#slider-4" ).slider( "values", 1 ));

	function setLayers2( event, ui ) {
		var min =ui.values[ 0 ] ;
		var max =ui.values[ 1 ];
						 $( "#price2" ).val( min+ " - " + max);

				for (i = 0; i < layers.length; i++) {

					//Reset map and control
					layer_control.removeLayer(layers[i])
					map.removeLayer(layers[i])

					//Add layers to map and control depending on dates
				  var date = Number(dates[i]);
					if(date<min ||date>max){
						layer_control.removeLayer(layers[i])
						map.removeLayer(layers[i])
					}
					if(date>=min && date<=max){
						if (map.hasLayer(layers[i])){
						}
						else{
							var string = '\
							<span onmouseover="listMouseOver('+i+')" onmouseout="listMouseOut('+i+')">'+names[i]+'</span>'
							layer_control.addOverlay(layers[i],string);
							map.addLayer(layers[i])
						}
					}

				}
	}

	//Open the interaction panel
	opensmalltab();

	//map.addLayer(mvp_points);
	//layer_control.addOverlay(mvp_points, "MVP_Data");

	for (i = 0; i < layers.length; i++) {
			map.addLayer(layers[i]);
			var string = '\
				<span onmouseover="listMouseOver('+i+')" onmouseout="listMouseOut('+i+')">'+names[i]+'</span>'
			layer_control.addOverlay(layers[i],string);
	}

	bathyLegend.remove();
	pointsLegend.addTo(map);

	layer_control._update();
	layer_control.expand();
}

function ADCPActive(){

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("adcp");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(7);

	//Remove Layers from map
	removeLayersMap();

	removePolygonsMVP();
	removePolygonsADCP();
	//Create form for the interaction panel
	document.getElementById("accordionText").innerHTML =createForm('adcp');

	$( "#slider-3" ).slider({
							 range:true,
							 min: startyearadcpPol,
							 max: endyearadcpPol,
							 values: [ startyearadcpPol,endyearadcpPol ],
							 slide: setLayers

						});
	$( "#price" ).val( $( "#slider-3" ).slider( "values", 0 ) +" - " + $( "#slider-3" ).slider( "values", 1 ));

	function setLayers( event, ui ) {
		var min =ui.values[ 0 ] ;
		var max =ui.values[ 1 ];
						 $( "#price" ).val( min+ " - " + max);

				for (i = 0; i < layers.length; i++) {
				  var date = Number(dates[i]);
					if(date<min ||date>max){
						layers_control.removeLayer(layers[i])
						map.removeLayer(layers[i])
					}
					if(date>=min && date<=max){
						if (map.hasLayer(layers[i])){
						}
						else{
							var string = '\
							<span onmouseover="listMouseOver('+i+')" onmouseout="listMouseOut('+i+')">'+names[i]+'</span>'
							layers_control.addOverlay(layers[i],string);
							map.addLayer(layers[i])
						}
					}

				}
	}

	function setLayers( event, ui ) {
		var min =ui.values[ 0 ] ;
		var max =ui.values[ 1 ];
						 $( "#price" ).val( min+ " - " + max);

				//for (i = 0; i < layers.length; i++) {
				 /* var date = Number(dates[i]);
					if(date<min ||date>max){
						control.removeLayer(layers[i])
						myMap.removeLayer(layers[i])
					}
					if(date>=min && date<=max){
						if (myMap.hasLayer(layers[i])){
						}
						else{
							var string = '\
							<span onmouseover="listMouseOver('+i+')" onmouseout="listMouseOut('+i+')">'+names[i]+'</span>'
							control.addOverlay(layers[i],string);
							myMap.addLayer(layers[i])
						}
					}
*/
			//	}
	}

	//Open the interaction panel
	opensmalltab();

	bathyLegend.remove();
	pointsLegend.addTo(map);

	for (i = 0; i < layersADCP.length; i++) {
			map.addLayer(layersADCP[i]);
			var string = '\
				<span onmouseover="listMouseOver('+i+')" onmouseout="listMouseOut('+i+')">'+names[i]+'</span>'
			layer_control.addOverlay(layersADCP[i],string);
	}

	//layer_control.addOverlay(adcp, "ADCP_Data");

	layer_control._update();
	layer_control.expand();
}

function WeatherActive(){

	//Clear the interaction panel (in this layer, the panel only opens when a marker is clicked
	document.getElementById("accordionText").innerHTML='';
	//Close the interaction panel (if open)
	closetab();

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("weatherStations");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(4);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	pointsLegend.remove();
	bathyLegend.remove();

	map.addLayer(weatherStations);
	layer_control.addOverlay(weatherStations, "Weather Stations");

	layer_control._update();
}

function WaterLevelActive(){

	//Clear the interaction panel (in this layer, the panel only opens when a marker is clicked
	document.getElementById("accordionText").innerHTML='';
	//Close the interaction panel (if open)
	closetab();

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("hydrometricStations");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(3);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	pointsLegend.remove();
	bathyLegend.remove();

	map.addLayer(hydrometricStations);
	layer_control.addOverlay(hydrometricStations, "Hydrometric Stations");

	layer_control._update();
}


function orthoActive(){

	closetab();

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("hydrometricStations");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(5);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	//Create form for the interaction panel
	document.getElementById("accordionText").innerHTML =createForm('ortho');

	//Open the interaction panel
	opensmalltab();

	pointsLegend.remove();
	bathyLegend.remove();

	map.addLayer(ortho);
	layer_control.addOverlay(ortho, "NB Orthophotographs");

	layer_control._update();
}

function buoyActive(){

	//Clear the interaction panel (in this layer, the panel only opens when a marker is clicked
	document.getElementById("accordionText").innerHTML='';
	//Close the interaction panel (if open)
	closetab();

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("buoys");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(6);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	pointsLegend.remove();
	bathyLegend.remove();

	map.addLayer(buoys);
	layer_control.addOverlay(buoys, "Buoys");

	layer_control._update();
}

//var urlCSV = 'http://131.202.94.74:8080/geoserver/oceanMapping/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=oceanMapping:NHN_01AP000_2_0_HN_BANK_1&outputFormat=csv';
var urlKML = 'http://131.202.94.74:8080/geoserver/oceanMapping/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=oceanMapping:coastlines&outputFormat=kml';
var urlWFS = 'http://131.202.94.74:8080/geoserver/oceanMapping/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=';
var urlxyz = 'http://131.202.94.74:8080/geoserver/ows?service=WCS&version=2.0.1&request=GetCoverage&format=GDAL-XYZ';
var urlgtiff = 'http://131.202.94.74:8080/geoserver/wcs?service=WCS&version=1.0.0&request=GetCoverage&format=image/tiff';
//var formCoast='<a target="_blank" href='+urlCSV+'>Download Data in csv</a><a style="margin-left:20px" target="_blank" href='+urlKML+'>Download Data in KML</a>';
//formCoast=formCoast+'<button class="btn btn-primary" style="margin-left:10px" onclick=window.open("http://131.202.94.74/metadata/RHN_01AP000_3.0_20171204-164659.xml","_blank")>Metadata</button>'

function coastActive(){

	closetab();

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("coast");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(8);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	//Create link to download

	document.getElementById("accordionText").innerHTML=createForm('coast');;

	//Open interaction panel
	opensmalltab();

	pointsLegend.remove();
	bathyLegend.remove();

	map.addLayer(coast);
	layer_control.addOverlay(coast, "Coast Lines");

	layer_control._update();
}

function tidesActive(){

	closetab();

	//Reset activeLayers
	activeLayers=[];
	activeLayers=activeLayers.concat(allLayers);

	clearEditable();
	map.closePopup();

	var index = activeLayers.indexOf("tidalStations");
	if (index > -1) {
    activeLayers.splice(index, 1);
	}

	//Reset links
	resetLinks(9);

	//Remove Layers from map
	removeLayersMap();
	removePolygonsMVP();
	removePolygonsADCP();

	//Create link to download

	document.getElementById("accordionText").innerHTML="";


	//Open interaction panel
	//opensmalltab();

	pointsLegend.remove();
	bathyLegend.remove();

	map.addLayer(tidalStations);
	layer_control.addOverlay(tidalStations, "Tidal Gauges");

	layer_control._update();
}

function resetLinks(value){
	for (i=1;i<10;i++){
		if (i==value){
			$('#link'+i+'')[0].classList.add('inactiveLink');
			$('#link'+i+'')[0].classList.add('colorBlue');
		}
		else{
			$('#link'+i+'')[0].classList.remove('colorBlue');
			$('#link'+i+'')[0].classList.remove('inactiveLink');
		}
	}
}

function removeLayersMap(){
	for (i=0;i<activeLayers.length;i++){
		map.removeLayer(eval(activeLayers[i]));
		layer_control.removeLayer(eval(activeLayers[i]));
	}
}


//Create form to add to the interactive panel for the different layers
function createForm(activeLayer){
	var formString;

	if (activeLayer =='mvp_points'){


		var startyear = eval("startyear"+activeLayer);
		var endyear = eval("endyear"+activeLayer);

		formString ="<p><label for = 'price'>Year range:</label><input type = 'text' id = 'price2'";
		formString=formString+"style = 'border:0; font-weight:bold;'></p>";
	  formString= formString+"<div id = 'slider-4'></div>";

		/*formString ="Select the year (Years available: "+startyear+"-"+endyear+")";

		formString=formString+'<input id="ADCPyear" type="number" maxlength="4" size="4" style="margin-left:10px" value='+startyear+' max='+endyear+' min='+startyear+'></input>';
		formString=formString+"<span style='margin:30px'> Select the month: </span>";
		formString=formString+'<input id="ADCPmonth" type="number" max=12 min=1 ></input>';
		formString=formString+"<span style='margin:30px'> Select the day: </span>";
		formString=formString+'<input id="ADCPday" type="number" max=31 min=1 ></input></br></br>';
		formString=formString+'<button class="btn btn-primary" data-toggle="modal" data-target="#myModal" style="margin-left:10px" onclick="createGraph(\''+activeLayer+'\')">Show Data Available</button>';
		//buttonLoadData='<button class="btn btn-primary" style="margin-left:10px" onclick="setLayer(\''+activeLayer+'\')">Load Data on the Map</button>';
		formString=formString+'<button class="btn btn-primary" style="margin-left:10px" onclick="setLayer(\''+activeLayer+'\')">Load Data on the Map</button>';
		//formString=formString+buttonLoadData;
		formString=formString+'<button class="btn btn-primary" style="margin-left:10px" onclick="downloadData(\''+activeLayer+'\')">Select area to download</button>';*/
	}

	if (activeLayer =='adcp' ){

		var startyear = Number(eval("startyear"+activeLayer));
		var endyear = Number(eval("endyear"+activeLayer));


		formString ="<p><label for = 'price'>Year range:</label><input type = 'text' id = 'price'";
		formString=formString+"style = 'border:0; font-weight:bold;'></p>";
	  formString= formString+"<div id = 'slider-3'></div>";



	}

	else if (activeLayer =='ortho'){


		formString ='<button class="btn btn-primary" style="margin-left:10px" onclick="downloadData(\''+activeLayer+'\')">Select area to download</button>';
		formString =formString+'<button class="btn btn-primary" style="margin-left:10px" onclick=window.open("http://131.202.94.74/orthophotos/45406600.txt","_blank")>Metadata</button>';
	}

		else if (activeLayer =='coast'){


		formString ='<button class="btn btn-primary" style="margin-left:10px" onclick="downloadData(\''+activeLayer+'\')">Select area to download</button>';
		formString=formString+'<button class="btn btn-primary" style="margin-left:10px" onclick=window.open("http://131.202.94.74/metadata/RHN_01AP000_3.0_20171204-164659.xml","_blank")>Metadata</button>';
	}

	else if (activeLayer =='bathy'){
		//var startyear = eval("startyearbath");
		//var endyear = eval("endyearbath");

		var startyear = 2000;
		var endyear = 2008;

		queriedYear=startyear;
		//Set footprint year to the first one
		footprints._source._overlay.setParams({time: startyear});

		formString ="Click on a point on the map to retrieve depth information. ";

		formString =formString+"Select the year of the survey to see the footprint.<br>Year Selected: <span id='valuebath'></span><br>";

		formString=formString+'<div class="row" style="margin-left:10px;"><span style="margin-right:10px;">'+startyear+'</span><div class="slidecontainer"><input type="range" value='+startyear+' max='+endyear+' min='+startyear+' class="slider" id="myRangebath"></div><span style="margin-left:10px;">'+endyear+'</span></div>';
		formString=formString+'<button class="btn btn-primary" style="margin-left:10px" onclick="downloadData()">Select area to download/compute statistics</button>';

		formString=formString+'<button class="btn btn-primary" style="margin-left:10px" onclick="profileGeneration()">Longitudinal profile</button>';
	}

	return formString;
}

//Function to download data
function downloadData(layername){

	//ADCP data is not available
	if (layername=="adcp"){
		alert("Data is not available yet");
	}
	//When downloading mvp points data , a polygon drawing tool is started to select the area
	else if (layername=="mvp_points"){
		queriedYear = parseInt(document.getElementById("ADCPyear").value);
		clearEditable();
		var polygon = new L.Draw.Polygon(map);
		map.dragging.disable();
		polygon.setOptions({shapeOptions: {
				color: '#e1e100'
		}});
		polygon.enable();
	}
	//When downloading bathymetry or orthophotographs, a rectangle drawing tool is started to select the area
	else{
		if (layername!="ortho"&&layername!="coast"){
			queriedYear = parseInt(document.getElementById("valuebath").value);
		}
		clearEditable();
		myPolygonHandler = new L.Draw.Rectangle(map);
		map.dragging.disable();
		myPolygonHandler.setOptions({shapeOptions: {
				color: '#e1e100'
		}});
		myPolygonHandler.enable();
	}
}

var myPolygonHandler;
var myPolylineDrawHandler;

//Function to clear all layers but markers
function clearEditable(){
	editableLayers.eachLayer(function(feature) {

		if (feature instanceof L.Marker){
		}else{
		map.eachLayer(function(mapLayer) {
			if (mapLayer.hasLayer) {
				mapLayer.removeLayer(feature);
			}
		});
		}
	});
}

//Function to generate a longitudinal profile
function profileGeneration(){
	myPolylineDrawHandler = new L.Draw.Polyline(map);
	map.dragging.disable();
	clearEditable();
	myPolylineDrawHandler.setOptions({shapeOptions: {
				color: '#e1e100'
		}});
	myPolylineDrawHandler.enable();
}
	const verticalLinePlugin = {
			  getLinePosition: function (chart, pointIndex) {
				  const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
				  const data = meta.data;
				  return data[pointIndex]._model.x;
			  },
			  renderVerticalLine: function (chartInstance, pointIndex) {
				  const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
				  const scale = chartInstance.scales['y-axis-0'];
				  const context = chartInstance.chart.ctx;

				  // render vertical line
				  context.beginPath();
				  context.strokeStyle = '#ff0000';
				  context.moveTo(lineLeftOffset, scale.top);
				  context.lineTo(lineLeftOffset, scale.bottom);
				  context.stroke();

				  /* write label
				  context.fillStyle = "#ff0000";
				  context.textAlign = 'right';
				  context.fillText('MY TEXT', lineLeftOffset, (scale.bottom - scale.top) / 2 + scale.top);*/
			  },

			  afterDatasetsDraw: function (chart, easing) {
				  if (chart.config.lineAtIndex) {
					  chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
				  }
			  }
  };
  Chart.plugins.register(verticalLinePlugin);

  function setLayer(layername){

	map.addLayer(eval(layername));

	queriedYear = parseInt(document.getElementById("ADCPyear").value);
	queriedMonth = parseInt(document.getElementById("ADCPmonth").value);
	queriedDay = parseInt(document.getElementById("ADCPday").value);
	var timequery;

	if (isNaN(queriedDay)){
		if (isNaN(queriedMonth)){
		timequery = queriedYear;
		}else{
		timequery = queriedYear+'-'+queriedMonth;
		}
	}else{
		timequery = queriedYear+'-'+queriedMonth+'-'+queriedDay;
	}


	eval(layername)._source._overlay.setParams({time: timequery});



  }

    function setLayer2(layername,day,month){

	map.addLayer(eval(layername));

	switch(month){
		case 'Jan':
			month=1;
		break
		case 'Feb':
			month=2;
		break
		case 'Mar':
			month=3;
		break
		case 'Apr':
			month=4;
		break
		case 'May':
			month=5;
		break
		case 'Jun':
			month=6;
		break
		case 'Jul':
			month=7;
		break
		case 'Aug':
			month=8;
		break
		case 'Sep':
			month=9;
		break
		case 'Oct':
			month=10;
		break
		case 'Nov':
			month=11;
		break
		case 'Dec':
			month=12;
		break

	}

	queriedYear = parseInt(document.getElementById("ADCPyear").value);
	queriedMonth = month;
	queriedDay = day;
	var timequery;

	if (isNaN(queriedDay)){
		if (isNaN(queriedMonth)){
		timequery = queriedYear;
		}else{
		timequery = queriedYear+'-'+queriedMonth;
		}
	}else{
		timequery = queriedYear+'-'+queriedMonth+'-'+queriedDay;
	}


	eval(layername)._source._overlay.setParams({time: timequery});


	document.getElementById("ADCPmonth").value=month;
	document.getElementById("ADCPday").value=day;

	document.getElementById("closeModalBtn").click();



  }

  data2001=[1.4572,1.37132,1.31636,1.33332,1.33432,1.30632,1.29124,1.30204,1.35288,1.39592,1.4374,1.3974,1.36272,1.3448,1.3032,1.30708,1.2466,1.18328,1.1584,1.13176,1.11684,1.1014,1.05864,1.07012,1.0842,1.09044,1.09924,1.09336,1.04756,1.0478,1.0548,1.03636,0.9852,0.96788,0.93784,0.93948,1.0104,1.01292,1.03124,1.0852,1.19556,1.17036,1.11116,1.11872,1.09672,1.09872,1.04704,1.05836,0.99156,0.97036,0.98148,0.99684,1.00288,1.00672,0.99712,0.93572,0.99832,0.99496,0.97404,0.97148,0.97128,0.95792,0.92428,0.90368,0.94648,1.01516,1.06464,1.10484,1.16628,1.18664,1.17092,1.14568,1.1804,1.12564,1.06404,0.99732,0.94144,0.89436,0.87716,0.87148,0.91016,1.01404,1.08636,1.10256,1.1114,1.11988,1.10932,1.07772,1.05056,1.05588,1.07368,1.05068,1.03144,1.01868,1.03108,1.06224,1.11608,1.16376,1.22372,1.25688,1.25868,1.27288,1.33976,1.41028,1.45676,1.51872,1.60888,1.7206,1.80824,1.89332,2.04224,2.25416,2.53012,2.93036,3.33552,3.62784,3.817,3.92132,3.93808,3.89536,3.813,3.73688,3.64824,3.60528,3.6352,3.62908,3.57256,3.47228,3.32724,3.17844,3.01636,2.8414,2.62712,2.48248,2.5156,2.53344,2.48396,2.40308,2.31804,2.252731707,2.159184211,2.105842105,2.067285714,1.998117647,1.935125,1.8518,1.744625,1.68975,1.662588235,1.622722222,1.577473684,1.5524,1.5376,1.564631579,1.61575,1.691470588,1.7961875,1.820733333,1.857066667,1.8665,1.818764706,1.718133333,1.635933333,1.530384615,1.468461538,1.4023125,1.3485625,1.223588235,1.196529412,1.230555556,1.2841,1.306411765,1.331315789,1.343578947,1.309315789,1.345263158,1.373842105,1.38555,1.367833333,1.28495,1.2091,1.18675,1.181529412,1.170894737,1.146526316,1.15,1.16165,1.1574,1.108888889,1.109235294,1.112052632,1.101105263,1.068473684,1.0438,1.025470588,1.014368421,1.025,1.0536875,1.128294118,1.206578947,1.29795,1.373157895,1.3863,1.40825,1.4633,1.49825,1.415736842,1.390411765,1.338777778,1.275117647,1.239941176,1.199529412,1.172526316,1.136411765,1.131529412,1.126833333,1.079,1.078529412,1.04675,1.045823529,0.993882353,0.95505,0.924470588,0.853315789,0.822235294,0.811866667,0.811,0.806210526,0.842666667,0.89415,0.949181818,0.983631579,1.0187,1.03345,1.02652381,1.011761905,0.975571429,0.913894737,0.881,0.877578947,0.870647059,0.860894737,0.839555556,0.883952381,0.91865,0.91455,0.944368421,0.977421053,0.972285714,0.97015,0.9332,0.875909091,0.84805,0.855736842,0.820105263,0.8083,0.822578947,0.85275,0.892571429,0.929904762,0.976789474,1.025619048,1.024210526,0.9956,1.003315789,0.971285714,0.934578947,0.881,0.861473684,0.873,0.878833333,0.908666667,0.910090909,0.910714286,0.95625,0.975578947,0.959772727,0.972421053,0.974473684,0.985727273,0.946684211,0.890368421,0.847666667,0.815578947,0.81785,0.848052632,0.90475,0.961666667,1.019428571,1.089210526,1.147809524,1.152631579,1.143666667,1.105190476,1.067526316,1.0182,0.987055556,0.994055556,0.989,1.037294118,1.038,1.018352941,1.026263158,1.014210526,1.012285714,1.026526316,1.0589,1.0688,1.085388889,1.1044,1.093,1.0906,1.096222222,1.079588235,1.09915,1.08685,1.124842105,1.110952381,1.150461538,1.167166667,1.143678571,1.123678571,1.08437037,1.080964286,1.06868,1.02016,0.963791667,0.9062,0.86684,0.852769231,0.88208,0.907111111,0.90284,0.951464286,0.992115385,1.03375,1.092321429,1.104074074,1.126,1.176333333,1.189857143,1.21256,1.208857143,1.241481481,1.187857143,1.198384615,1.226769231,1.273758621,1.280896552,1.276178571,1.2546,1.242571429,1.21116,1.159125,1.116833333,1.050576923,0.960192308,0.92476,0.945576923,0.938037037,0.97508,1.003192308,1.03644,1.060310345,1.049571429];
  data2002=[1.051758621,1.027642857,1.034964286,1.038384615,1.019653846,1.006357143,0.988068966,0.963538462,0.951769231,0.962884615,0.984846154,1.001793103,1.009818182,0.9516,0.930925926,0.964807692,0.917517241,0.933964286,0.897666667,0.873357143,0.86188,0.813555556,0.79292,0.8038,0.827076923,0.862269231,0.872259259,0.939185185,1.004133333,1.065068966,1.082392857,1.088193548,1.096290323,1.054714286,1.063423077,1.064807692,1.00728,0.94237931,0.972107143,0.94172,0.907392857,0.9883125,1.022481481,1.069464286,1.047538462,1.027310345,1.037807692,1.035392857,1.00588,0.97837037,0.95056,0.946461538,0.974928571,0.993916667,1.019107143,1.037192308,1.102035714,1.239424242,1.595606061,1.832357143,1.882724138,1.924933333,2.050607143,2.0245,1.93296,1.84292,1.73096,1.62792,1.64883871,1.698264706,1.7,1.700857143,1.719862069,1.684038462,1.706111111,1.618678571,1.50712,1.45868,1.387153846,1.375083333,1.376407407,1.306566667,1.230516129,1.162653846,1.1578,1.2425,1.445714286,1.601433333,1.679259259,1.747689655,1.843892857,2.040666667,2.133407407,2.249964286,2.292208333,2.277416667,2.20484,2.116304348,2.070230769,2.1124,2.175541667,2.238,2.31616,2.475333333,2.740347826,2.975041667,3.1258,3.220892857,3.28084,3.355708333,3.40528,3.441826087,3.46596,3.444347826,3.385307692,3.345458333,3.283461538,3.1955,3.134785714,3.07575,2.950076923,2.808791667,2.69703125,2.4972,2.360192308,2.241625,2.179961538,2.147814815,2.119269231,2.129285714,2.138896552,2.105296296,2.074653846,2.076538462,2.092807692,2.07752,2.056769231,2.0487,2.003689655,1.985208333,1.965576923,1.954346154,1.92848,1.928035714,1.9375,1.893034483,1.849037037,1.7936,1.729923077,1.68388,1.676111111,1.634466667,1.568107143,1.564333333,1.48136,1.428777778,1.420423077,1.400777778,1.39972,1.343962963,1.365923077,1.370607143,1.387961538,1.391269231,1.39864,1.392407407,1.36196,1.35244,1.31204,1.270076923,1.221285714,1.208307692,1.230615385,1.219266667,1.233862069,1.264461538,1.224730769,1.213692308,1.19564,1.180730769,1.112307692,1.0588,1.051037037,1.061814815,1.147,1.270333333,1.419,1.528518519,1.645538462,1.770346154,1.861615385,1.878423077,1.872615385,1.855740741,1.789777778,1.753692308,1.756518519,1.791814815,1.74412,1.6858,1.652115385,1.612076923,1.538,1.51584,1.526833333,1.474407407,1.432923077,1.390230769,1.334925926,1.303925926,1.30124,1.272333333,1.21373913,1.130923077,1.08272,1.053961538,1.00044,1.010307692,1.070115385,1.097576923,1.15508,1.1726,1.175384615,1.188423077,1.18476,1.139692308,1.088807692,1.059222222,1.038730769,1.000777778,0.9786,0.96344,0.94356,0.934407407,0.926074074,0.91792,0.929230769,0.931481481,0.897192308,0.84524,0.803884615,0.770592593,0.74264,0.706307692,0.696375,0.701541667,0.735769231,0.798592593,0.841307692,0.889115385,0.912964286,0.957653846,1.002423077,1.036766667,1.097444444,1.0361,0.99168,0.950423077,0.951615385,0.96264,0.9732,0.982208333,0.987535714,0.996807692,1.014615385,1.027821429,1.055307692,0.989423077,0.94824,0.92724,0.948076923,0.927222222,0.90176,0.895083333,0.89962963,0.923615385,0.965222222,0.990928571,1.058870968,1.090166667,1.151892857,1.118407407,1.09716,1.049785714,1.016230769,0.971814815,0.949928571,0.91296,0.89092,0.96375,0.956142857,0.954740741,1.014033333,1.006538462,1.017307692,0.984777778,1.000384615,0.978115385,0.974115385,0.996551724,0.99288,0.97036,0.943153846,0.938769231,0.950185185,0.992066667,1.0385,1.033333333,1.096333333,1.141692308,1.235928571,1.19537931,1.188814815,1.141448276,1.13496,1.116555556,1.144242424,1.286241379,1.41816,1.4482,1.47275,1.582628571,1.66004,1.706,1.682653846,1.688259259,1.801366667,1.8704375,1.84464,1.812269231,1.75284,1.71116,1.67762963,1.644846154,1.64837931,1.598153846,1.588851852,1.547,1.515821429,1.504148148,1.46162963,1.381892857,1.271230769,1.213142857,1.131307692,1.08764,1.060111111,1.065653846,1.212807692,1.29,1.331,1.318222222,1.284555556,1.339928571,1.496724138,1.658807692,1.73908,1.754481481,1.73,1.691071429,1.598,1.55776,1.530333333,1.47012,1.4438];
  data2003=[1.4555,1.449678571,1.442857143,1.474576923,1.473653846,1.431692308,1.39552,1.37172,1.3468,1.30952,1.20968,1.10848,1.04116,1.01444,0.998807692,1.0218,1.040357143,1.034458333,1.00092,1.128071429,1.122423077,1.086153846,1.069916667,1.090142857,1.06268,1.054730769,1.055541667,1.026142857,0.98525,0.985777778,0.976592593,1.01252,1.072482759,1.09,1.118464286,1.15632,1.065592593,1.01044,0.9815,0.929307692,0.88572,0.895583333,0.86768,0.846,0.784153846,0.775576923,0.811071429,0.848074074,0.951962963,1.04162963,1.056107143,1.076076923,1.067148148,1.111580645,1.109592593,0.997285714,0.957730769,0.945517241,0.975538462,1.01684,1.034142857,1.118642857,1.124857143,1.1985,1.217041667,1.165153846,1.12373913,1.101,1.043,1.014888889,0.97172,0.898115385,0.8462,0.861814815,0.910035714,0.97775,1.059375,1.11084375,1.124185185,1.158068966,1.193857143,1.223703704,1.252153846,1.237230769,1.264296296,1.302038462,1.348962963,1.436666667,1.7258,2.236344828,2.511037037,2.53324,2.495416667,2.431833333,2.362,2.29176,2.12984,2.00344,1.910125,1.83444,1.80136,1.863740741,2.047653846,2.131,2.236230769,2.373214286,2.508230769,2.548851852,2.58472,2.625740741,2.706461538,2.805461538,2.95268,3.213125,3.419565217,3.537347826,3.637458333,3.73825,3.761035498,3.757205145,3.717086634,3.723291667,3.69604,3.647,3.553869565,3.427913043,3.296916667,3.199291667,3.112913043,3.0355,2.97125,2.9335,2.9262,2.92084,2.925586207,2.890777778,2.853076923,2.786807692,2.711,2.587769231,2.44075,2.274692308,2.108708333,1.968041667,1.867814815,1.767185185,1.67948,1.648555556,1.66016,1.6524,1.635692308,1.619645161,1.686481481,1.700633333,1.680115385,1.654708333,1.652037037,1.627625,1.613038462,1.640481481,1.644740741,1.625222222,1.657666667,1.67716,1.684310345,1.712448276,1.728592593,1.683461538,1.6635,1.644923077,1.606407407,1.526076923,1.456357143,1.37152,1.313807692,1.23868,1.211423077,1.216148148,1.209076923,1.14037037,1.094142857,1.1232,1.119740741,1.113740741,1.121142857,1.116035714,1.15212,1.173692308,1.16062963,1.15762963,1.141576923,1.150571429,1.202793103,1.221,1.201285714,1.210192308,1.222777778,1.192076923,1.172962963,1.112555556,1.044925926,0.971576923,0.916923077,0.905607143,0.930076923,0.954923077,1.000333333,1.080285714,1.182571429,1.21868,1.241962963,1.261923077,1.275384615,1.264814815,1.263185185,1.243518519,1.285576923,1.388814815,1.51884,1.584296296,1.661166667,1.7755,1.881923077,1.988291667,2.05384,2.0968,2.04504,1.956576923,1.876884615,1.7838,1.674791667,1.57828,1.48628,1.40876,1.377814815,1.301793103,1.235730769,1.242730769,1.294517241,1.303285714,1.273357143,1.300461538,1.299,1.285857143,1.237586207,1.166925926,1.139692308,1.1368,1.096518519,1.0738,1.066416667,1.078115385,1.055461538,1.038923077,1.016111111,0.990538462,0.95962963,0.945269231,0.92296,0.887111111,0.81764,0.76225,0.74992,0.768846154,0.762,0.781576923,0.828653846,0.871107143,0.926,0.96525,1.008586207,1.086214286,1.129758621,1.179230769,1.185076923,1.194785714,1.182192308,1.197928571,1.18396,1.204038462,1.186961538,1.181666667,1.20212,1.199291667,1.145642857,1.173347826,1.190829001,1.255483871,1.299884615,1.206291667,1.097296296,1.041884615,1.029875,1.065642857,1.19296,1.333793103,1.40828,1.439137931,1.464862069,1.532821429,1.734448276,2.05465625,2.53537931,2.89228,3.02116,3.000125,2.936347826,2.857695652,2.77976,2.680541667,2.58428,2.513466667,2.312230769,2.196791667,2.101192308,2.047814815,2.048102564,2.039384615,1.98104,1.88512,1.819625,1.780230769,1.75144,1.80375,1.905518519,2.094461538,2.273689655,2.404142857,2.493333333,2.495269231,2.414807692,2.335071429,2.35,2.377962963,2.376576923,2.33668,2.26884,2.164833333,2.07624,2.003548387,2.011033333,1.914,1.81588,1.712,1.65136,1.70340625,1.69728,1.6162,1.631269231,1.53336,1.52596,1.670642857,1.78188,1.863038462,1.934961538,1.953038462,1.998857143,2.047807692,2.145481481,2.306192308,2.438038462,2.467185185,2.43316,2.38576,2.376916667];
  data2004=[2.26912,2.14624,2.042769231,1.994730769,1.91528,1.897666667,1.84432,1.75636,1.686541667,1.65456,1.599111111,1.56012,1.505153846,1.405111111,1.35032,1.34276,1.28392,1.285961538,1.33662963,1.3698,1.364269231,1.388777778,1.439222222,1.443875,1.382592593,1.328461538,1.271,1.26116,1.229583333,1.201,1.1718,1.0865,0.99172,0.955037037,1.026615385,1.050961538,1.035962963,1.08732,1.072642857,1.050333333,1.0984,1.119538462,1.077148148,1.06244,1.09368,1.07412,1.0336,0.993925926,1.005730769,1.038444444,1.068730769,1.118961538,1.192357143,1.184653846,1.150346154,1.125769231,1.0796,1.03256,0.984391304,0.92588,0.8635,0.829576923,0.851269231,0.8566,0.870230769,0.961692308,1.014518519,1.056678571,1.130115385,1.1334,1.123192308,1.145384615,1.112,1.004423077,0.999037037,0.987615385,0.994692308,1.058730769,1.057068966,1.061642857,1.108777778,1.117464286,1.08508,1.06176,0.99636,0.940153846,0.93825,0.939615385,0.981304348,1.012538462,1.080041667,1.18256,1.258518519,1.45376,1.689142857,1.945296296,2.120259259,2.228678571,2.278153846,2.325115385,2.326666667,2.309,2.24212,2.184730769,2.219222222,2.431851852,2.688367719,2.771908877,2.830300662,2.85884537,2.921142055,2.947360717,2.990672034,3.007976667,2.972927823,2.878300363,2.739693644,2.642517865,2.537290867,2.421414419,2.331015172,2.298659577,2.295575737,2.322,2.385370613,2.51779662,2.575913058,2.622234242,2.600662703,2.55608867,2.447647955,2.340194989,2.215695396,2.046548206,1.92544055,1.854390258,1.852732823,1.769656022,1.695984766,1.68355896,1.620686286,1.577123849,1.553943089,1.520462203,1.512233009,1.478437503,1.404701033,1.394899902,1.38992277,1.411288979,1.431272124,1.446198198,1.467513764,1.516832007,1.591416587,1.640877279,1.582482001,1.569075779,1.589591122,1.5799387,1.52483053,1.512092266,1.425678323,1.344954393,1.300845082,1.228870068,1.21567138,1.190695103,1.15,1.143203808,1.125614869,1.140560249,1.129547898,1.128230769,1.157221096,1.151671411,1.116948678,1.137609993,1.214880783,1.270760287,1.25741749,1.280443349,1.283456978,1.286996427,1.334670153,1.361382483,1.393011636,1.390054658,1.394996463,1.346429626,1.315,1.283074972,1.288251614,1.277899511,1.23271445,1.199451852,1.199673211,1.203856163,1.210365267,1.203064688,1.231894255,1.256666996,1.292892079,1.266787986,1.245879477,1.218943391,1.239142484,1.281136771,1.310754461,1.332639367,1.351235632,1.365211284,1.385742752,1.37795722,1.390138253,1.468085838,1.474888304,1.47536414,1.446071688,1.411504732,1.312890216,1.220873133,1.166526136,1.106140846,1.094932655,1.095286125,1.219042128,1.490604944,1.725164686,1.91441363,2.006672898,1.997885059,1.968500418,1.902539177,1.881320301,1.831140665,1.751629093,1.658129471,1.587125,1.53972,1.53032,1.51248,1.507296296,1.555407407,1.629615385,1.661961538,1.579821429,1.521172414,1.467407407,1.361461538,1.289153846,1.246125,1.239666667,1.3595,1.46025,1.605230769,1.71192,1.77824,1.805153846,1.796851852,1.788269231,1.781793103,1.768586207,1.697384615,1.64268,1.59562963,1.499076923,1.43037037,1.38796,1.393,1.368458333,1.374034483,1.371785714,1.36762963,1.368035714,1.28862963,1.283714286,1.304384615,1.248,1.126730769,1.00425,0.905407407,0.844375,0.850846154,0.866230769,0.909285714,0.945607143,0.983592593,1.033766667,1.094933333,1.171870968,1.19062963,1.157551724,1.108214286,1.119964286,1.132,1.110444444,1.113259259,1.128666667,1.175035714,1.179758621,1.17962069,1.152857143,1.154928571,1.149689655,1.119142857,1.053153846,1.043566667,0.995692308,1.026818182,1.033931034,0.987192308,1.02237037,1.068392857,1.074076923,1.110321429,1.154258065,1.185407407,1.196354839,1.221642857,1.262033333,1.248444444,1.216642857,1.173178571,1.128,1.077538462,1.05052,1.053714286,1.039107143,1.118241379,1.297486486,1.381518519,1.44062963,1.571266667,1.72292,1.846545455,1.925566667,1.967,1.963692308,1.894965517,1.76792,1.656576923,1.675107143,1.597166667,1.555076923,1.597645161,1.689633333,1.738896552,1.783172414,1.747592593,1.667444444,1.606111111,1.517259259,1.4893,1.467071429,1.40028,1.354518519,1.28352,1.360606061,1.5302,1.611777778,1.614230769,1.46796,1.494074074,1.504038462];
  data2005=[1.560269231,1.536071429,1.56208,1.521269231,1.503555556,1.472777778,1.495807692,1.491115385,1.511607143,1.544730769,1.550571429,1.560517241,1.587392857,1.636931034,1.632071429,1.626642857,1.5916,1.514791667,1.45144,1.436346154,1.37712,1.309875,1.300464286,1.293807692,1.294576923,1.28776,1.275666667,1.25848,1.205851852,1.207555556,1.18472,1.151703704,1.11636,1.083666667,1.05856,1.081074074,1.078678571,1.110923077,1.14,1.217142857,1.274259259,1.389071429,1.374444444,1.326857143,1.266384615,1.226444444,1.17708,1.182777778,1.14788,1.113833333,1.057769231,1.001458333,1.065384615,1.078666667,1.079666667,1.098192308,1.109346154,1.05268,1.038541667,1.091285714,1.14124,1.124041667,1.102083333,1.064333333,1.04468,1.048333333,1.1385,1.318148148,1.458259259,1.560035714,1.611464286,1.634296296,1.618296296,1.552481481,1.500961538,1.438625,1.37104,1.2958,1.222423077,1.1714,1.194703704,1.20125,1.255192308,1.309230769,1.285892857,1.286107143,1.282851852,1.550142857,1.942923077,2.082142857,2.154785714,2.20184,2.2387,2.352615385,2.540625,2.68424,2.825423077,2.961074074,3.051230769,3.12325,3.175076923,3.168518519,3.111,2.994583049,2.84861359,2.673170769,2.541212856,2.474025297,2.458872464,2.471043964,2.58525404,2.749568224,2.894314183,2.998177802,3.125568669,3.311415945,3.533873602,3.737811155,4.008567993,4.251494623,4.582726491,4.848240939,4.917817874,4.902109781,4.781025659,4.601501077,4.399815931,4.317674155,4.276051174,4.130995429,3.924704419,3.703837798,3.440106354,3.199534822,2.973985961,2.778632764,2.604173631,2.444609923,2.395870508,2.366395876,2.343642639,2.382939083,2.563572317,2.66596377,2.682798165,2.713418071,2.756324876,2.71425599,2.609950872,2.551950056,2.467398247,2.394955945,2.288501223,2.16904347,2.099395396,2.039517886,1.970710564,1.909113874,1.871448819,1.785573907,1.686377895,1.641417315,1.580342377,1.544165548,1.51178514,1.478546811,1.475476148,1.518512438,1.553419314,1.575682036,1.64154129,1.734585138,1.812106959,1.833618874,1.804135413,1.769068847,1.742529725,1.689995962,1.62113459,1.549903847,1.491998882,1.429706967,1.398633421,1.369560367,1.28580871,1.268822797,1.247420332,1.215963796,1.165313488,1.171371652,1.142088541,1.142557703,1.143982179,1.139055603,1.137492829,1.102688675,1.05341855,1.042355884,1.069725011,1.142322642,1.187826735,1.207522908,1.228719443,1.283662323,1.275996883,1.273443721,1.269544938,1.256170894,1.260901111,1.195516269,1.118724591,1.06267446,0.983918209,0.983690177,1.002428022,0.989968578,0.974895448,0.978462822,0.956675593,0.967949811,0.975645198,0.971965045,0.959884065,0.941827486,0.919732909,0.94681809,0.95063901,0.928452803,0.940108206,0.964146007,0.981370925,1.010306178,1.044565705,1.080824821,1.093250646,1.062901449,1.024290194,0.966525456,0.914991228,0.833955725,0.784801612,0.776433926,0.839586784,0.939455432,1.081559525,1.193307831,1.232314013,1.22044493,1.175505927,1.152667065,1.126198138,1.144785196,1.043952571,0.976796386,0.974737301,0.99489513,0.969514689,0.95598004,1.011117718,1.094168822,1.1870633,1.201927958,1.206236567,1.215751807,1.230943651,1.18518607,1.131890265,1.023454076,1.024032635,1.066616067,1.169295744,1.247041849,1.440657339,1.493817311,1.52741816,1.536111817,1.542200761,1.499319245,1.460628505,1.397556134,1.414011214,1.66164987,1.896878988,2.035567426,2.104931791,2.075715461,2.058615304,2.095472508,2.298308873,2.477327908,2.704445317,2.911373087,3.025391893,2.96924423,2.867987049,2.762012154,2.696705998,2.653838516,2.718243269,2.737063498,2.721105836,2.686544997,2.680852183,2.649529872,2.609688383,2.626673131,2.55745634,2.492338502,2.460412239,2.355932044,2.310147189,2.257302668,2.240773354,2.276088351,2.308125625,2.310171876,2.310034187,2.278313337,2.258946428,2.260686089,2.305464716,2.406931394,2.467088902,2.433472175,2.388456024,2.410548401,2.645760176,2.872360654,2.908299741,2.904551392,2.851892887,2.769693375,2.723041432,2.694862732,2.734564024,2.856909078,3.206578442,3.380277942,3.416581521,3.380399462,3.267169754,3.072972308,2.917144512,2.796355338,2.668111921,2.528972063,2.424300932,2.326260537,2.174658691,2.047686252,1.970951753,1.802205537,1.705472562,1.654251637,1.584146027,1.530191292,1.463888106,1.360227804,1.262220111,1.252813756,1.290194022,1.273483058,1.309440829,1.557664921,1.769741316];
  data2006=[1.866104697,1.916930976,1.912138264,1.892410151,1.894940041,1.873264431,1.816683566,1.698375359,1.610474818,1.532178018,1.410619569,1.409579452,1.443309525,1.528535526,1.836495694,2.222631882,2.304231822,2.353907874,2.42196244,2.469773089,2.507265912,2.392926136,2.310214909,2.326809849,2.329682693,2.319097783,2.24942568,2.216816939,2.22081214,2.245385215,2.231515105,2.268277529,2.223396875,2.187516219,2.137622843,2.066395626,2.078541223,2.060073253,2.02102081,1.96302008,1.871768792,1.772131087,1.774966275,1.750267004,1.687395902,1.637601835,1.560082561,1.574148857,1.537154626,1.4621263,1.455425815,1.43450936,1.331058896,1.261329347,1.30522169,1.324188478,1.354477489,1.375312639,1.431804447,1.497965956,1.525053329,1.527451202,1.513780744,1.446840375,1.40160197,1.320492217,1.230629333,1.160830244,1.122792922,1.147842044,1.103642021,1.151767183,1.242338178,1.377165913,1.482941238,1.528461758,1.534073411,1.498794303,1.468717821,1.449431104,1.41223609,1.374076753,1.323842195,1.28766047,1.346849293,1.453477914,1.560071976,1.572575385,1.615633333,1.724571429,1.792357143,1.908310345,1.959307692,2.008321429,2.062941176,2.12196,2.124027027,2.20976,2.246962963,2.274923077,2.278655172,2.232272727,2.20047619,2.314107143,2.430178571,2.621407407,2.784851852,2.902038462,2.965964286,3.000185185,2.985285714,2.95056,2.936346154,2.940074074,2.9486,2.958365854,2.981407407,2.955206897,2.873111111,2.78,2.672892857,2.514037037,2.36596,2.270807692,2.186,2.069828571,2.035961538,1.96896,1.943148148,1.922423077,1.910192308,1.910821429,1.905310345,1.895178571,1.869241379,1.8645,1.873108696,1.944193548,2.069666667,2.168466667,2.359727273,2.482962963,2.577703704,2.637538462,2.600410256,2.596707317,2.615633333,2.553516129,2.488964286,2.376333333,2.181888889,2.064125,1.91988,1.786107143,1.8115,2.073222222,2.127777778,2.067192308,2.066310345,2.088846154,2.146285714,2.297,2.4765,2.572821429,2.58,2.593866667,2.560484848,2.381113636,2.191568182,2.07038,1.999972222,1.953344828,1.844214286,1.8295,1.812928571,1.742514286,1.678857143,1.6215,1.562647059,1.514948718,1.461744681,1.381404762,1.325229167,1.392857143,1.396882353,1.411363636,1.4165,1.41928125,1.395794872,1.419111111,1.463888889,1.440909091,1.445033333,1.452285714,1.462295455,1.518611111,1.434604651,1.446727273,1.479785714,1.387566667,1.2703125,1.236361111,1.29683871,1.37612766,1.414535714,1.424052632,1.41416129,1.421741935,1.4387,1.464085714,1.49184375,1.457769231,1.413357143,1.420933333,1.397714286,1.277636364,1.252488372,1.256548387,1.306542169,1.373742857,1.374428571,1.324885714,1.363,1.3803125,1.394,1.355758621,1.28771875,1.267586207,1.191966667,1.127166667,1.035586207,1.043366667,1.0754,1.063433333,1.080222222,1.069,1.05475,1.034971429,0.967941176,0.956964286,0.946071429,0.956366667,0.918310345,0.871235294,0.81895,0.76785,0.845027027,0.907413793,0.952677419,1.01184375,1.04559375,1.084294118,1.121034483,1.142407407,1.113444444,1.095555556,1.046533333,0.995516129,0.930823529,0.917466667,0.889896552,0.891862069,0.942964286,0.958344828,0.907533333,0.89315625,0.939821429,0.981882353,0.965030303,0.951634146,0.931852941,0.89136,0.865083333,0.815424242,0.853333333,0.867142857,0.952,1.063702703,1.111162162,1.156756098,1.195292683,1.24344186,1.271162162,1.246542857,1.221958333,1.240323529,1.2039375,1.162789474,1.157258065,1.136606061,1.1573125,1.201885714,1.245045455,1.42212963,1.599028571,1.7888125,2.008125,2.13121875,2.145266667,2.115035714,2.086235294,2.077696078,2.083633333,2.12869697,2.163307692,2.270366667,2.317129032,2.336903226,2.2626,2.20984375,2.148166667,2.144581395,2.205388889,2.315818182,2.295111111,2.229030303,2.163551724,2.17752,2.319,2.621806452,2.71362963,2.897206897,2.961903226,2.989882353,2.931137931,2.836206897,2.754481481,2.629735294,2.516586207,2.373717949,2.2697,2.171064516,2.081644444,2.01175,2.027441176,2.046525,2.056676471,2.087944444,2.0884,2.01593617,2.02626087,1.994352941,1.861097561,1.746414634,1.667758621,1.598666667,1.498456522,1.473606061,1.442813953,1.452,1.419195122,1.481346154,1.505,1.429766667,1.435595238,1.405060606,1.402769231,1.448477273,1.490083333,1.565030303,1.6321875,1.60290625,1.506206897,1.422454545,1.3873125];
  data2007=[1.370066667,1.433580645,1.414517241,1.407419355,1.449735294,1.461871795,1.551461538,1.682515152,1.770195652,1.793366667,1.747,1.664,1.588933333,1.533064516,1.448655172,1.4478125,1.379551724,1.324172414,1.468837838,1.489333333,1.451424242,1.463058824,1.48616129,1.51115625,1.483433333,1.473176471,1.42921875,1.3555625,1.306793103,1.312827586,1.270866667,1.286272727,1.2713125,1.3016875,1.251114286,1.213514286,1.161535714,1.128171429,1.116424242,1.096125,1.038054054,0.967974359,0.897805556,0.790813953,0.8012,1.000744186,0.985894737,1.036651163,1.065,1.140833333,1.1475,1.186472222,1.215944444,1.215121212,1.20690625,1.128580645,1.080852941,1.061733333,1.026264706,1.03821875,1.061096774,1.161588235,1.157117647,1.18253125,1.1170625,1.07703125,1.101548387,1.08659375,1.019454545,0.939457143,0.8675625,0.831424242,0.830580645,0.896625,1.003971429,1.192446809,1.58422449,1.834611111,1.994714286,1.952314286,1.997116279,1.994606061,1.972066667,1.92871875,1.860862069,1.806103448,1.733147059,1.644657143,1.621333333,1.640709677,1.619030303,1.62534375,1.61259375,1.607034483,1.621666667,1.614866667,1.578178571,1.58859375,1.477133333,1.360645161,1.306692308,1.281258065,1.296133333,1.348233333,1.39721875,1.501527778,1.764925,2.024742857,2.132057143,2.173096774,2.2534375,2.335612903,2.383965517,2.477586207,2.692724138,2.915666667,3.078,3.231758621,3.314666667,3.353333333,3.394222222,3.402862069,3.393,3.367733333,3.331225806,3.234677419,3.151733333,3.036135733,2.93529473,2.870867831,2.823910745,2.828106185,2.843569596,2.807076274,2.807592112,2.784308537,2.818288886,2.751557666,2.684279188,2.666743766,2.680529402,2.56562319,2.43424099,2.305754184,2.218929467,2.151976445,2.002980224,1.909722701,1.876285617,1.791651861,1.780401565,1.773223389,1.74946238,1.661831497,1.601533288,1.627548998,1.619269902,1.589717912,1.576685801,1.584228069,1.582541848,1.592713057,1.559263172,1.519894655,1.447929883,1.424142572,1.409704343,1.402976334,1.383294209,1.343708674,1.331429431,1.300218776,1.257686814,1.195957325,1.136777584,1.088523657,1.074084718,1.116305618,1.175881319,1.180055345,1.14979455,1.136607588,1.154391296,1.166001571,1.169536707,1.155803231,1.191816516,1.222390185,1.169047301,1.133981875,1.110170723,1.087565821,1.142081231,1.169145494,1.189260082,1.212686319,1.260717626,1.278667472,1.29432051,1.292385844,1.307227636,1.303031277,1.239914386,1.141360919,1.115408504,1.067005135,1.062688228,1.066345081,1.043857826,1.062684538,1.068474127,1.113743538,1.153916793,1.171697248,1.192019942,1.17605206,1.170735444,1.211280359,1.192132608,1.171875707,1.212888899,1.150150815,1.180897347,1.225020542,1.230527203,1.249072772,1.221650624,1.188867694,1.186610209,1.136480512,1.052107731,0.981784168,0.918836007,0.861070797,0.809412608,0.827342006,0.876103881,0.933211913,0.951998966,0.967848225,1.012504116,1.065960542,1.130192325,1.160508976,1.106767481,1.087908015,1.069954111,1.040439411,1.022971363,0.994629919,0.998309984,1.000849165,1.017161173,1.048657924,1.099473431,1.056222485,1.009924541,0.990058299,0.957958429,0.915631092,0.849168921,0.74562934,0.728012499,0.724995102,0.714446761,0.74397491,0.773284244,0.843732091,0.957248575,0.99530221,1.079766197,1.16603261,1.107669159,1.072962005,1.016290348,0.995486938,0.98830309,0.971910605,0.923757197,0.936269772,0.924706395,0.970238993,1.022488997,1.086745689,1.105902243,1.111517158,1.082424441,1.042557837,1.057845321,1.052672885,1.039288136,1.040442276,1.094381808,1.147774651,1.104013709,1.245531895,1.244105626,1.343281222,1.323631337,1.315610743,1.443695038,1.469866451,1.505445526,1.520815731,1.512844823,1.533311856,1.45864853,1.726008612,1.910481248,1.997567416,2.121562998,2.226847985,2.234957001,2.210677477,2.148893761,1.969707081,1.914985007,1.879292779,1.851981396,1.866248921,2.035693318,2.251039681,2.350997883,2.39216183,2.440872413,2.459275525,2.5252,2.520966667,2.486419355,2.407151515,2.408714286,2.370666667,2.33228125,2.233633333,2.047472222,1.880354839,1.745964286,1.702709677,1.541285714,1.543142857,1.481,1.419392857,1.364096774,1.3435,1.329371429,1.341363636,1.233216216,1.242516129,1.199275862,1.187290323,1.254393939,1.172413793,1.14021875,1.162862069,1.187933333,1.185344828,1.22815625,1.312096774,1.418709677,1.503735294,1.545205882,1.562212121,1.517911765,1.540148148,1.479538462];
  data2008=[1.3804,1.33553125,1.236310345,1.203,1.165444444,1.17975,1.186724138,1.211192308,1.318451613,1.47471875,1.574314286,1.741515152,1.815677419,1.8948125,1.944206897,1.893964286,1.859172414,1.8693125,1.868071429,1.876875,1.839857143,1.795931034,1.804633333,1.773606061,1.741225806,1.708193548,1.634727273,1.591580645,1.505821429,1.483612903,1.400166667,1.278233333,1.312225806,1.256322581,1.199733333,1.240645161,1.3293125,1.376882353,1.385580645,1.402969697,1.41125,1.426733333,1.35437931,1.380133333,1.508967742,1.521387097,1.509566667,1.482387097,1.532,1.696064516,1.8525,1.897166667,1.8972,1.909931034,1.883741935,1.812483871,1.736666667,1.722441176,1.632928571,1.487827586,1.384766667,1.355966667,1.25075,1.254774194,1.266033333,1.369833333,1.350655172,1.413108108,1.682857143,1.842064516,1.84853125,1.840689655,1.825,1.7498,1.714030303,1.653870968,1.561344828,1.524133333,1.53728125,1.587516129,1.61383871,1.54571875,1.4965625,1.427461538,1.349641026,1.315875,1.290032258,1.22416129,1.172642857,1.066233333,0.965887755,0.994289474,1.079186441,1.170970674,1.266481203,1.366454545,1.476945946,1.602515152,1.739758621,1.842,1.98409375,2.109272727,2.223606061,2.32669697,2.392,2.405478261,2.412529412,2.49175,2.634588235,2.821611111,3.038631579,3.2598,3.442764706,3.656,3.863461538,4.079047619,4.204115385,4.280878788,4.346931034,4.400516129,4.457241379,4.637,4.946242424,5.220837838,5.287763158,5.204607143,5.076684211,4.952833333,4.821448276,4.691896552,4.544607143,4.38637931,4.197724138,3.961758621,3.7452,3.554807845,3.366519976,3.220747007,3.120024523,2.936431239,2.846412585,2.776297596,2.719703636,2.617450216,2.504033894,2.362763878,2.199848401,2.081169786,1.982123787,1.843124586,1.872565267,1.883749002,1.890167281,1.847331905,1.787345383,1.739555722,1.772918442,1.727093026,1.698231152,1.706597692,1.658888959,1.644585171,1.594485421,1.589264495,1.48872032,1.512984884,1.470394872,1.39433648,1.379724032,1.384540632,1.390224195,1.377777755,1.519275087,1.479547532,1.527634259,1.424637811,1.403192059,1.394562625,1.412031453,1.413609737,1.464171142,1.533594003,1.753834746,1.914304617,2.041952643,2.134348035,2.092847622,2.063445564,2.01663566,1.925537214,1.837754528,1.772628306,1.708646451,1.582280256,1.534605778,1.466255484,1.431922964,1.342859317,1.346788739,1.339521882,1.355006481,1.335042338,1.365835202,1.351139903,1.328730167,1.34926125,1.327581076,1.340296063,1.355755315,1.321763078,1.392570058,1.480572641,1.476287349,1.508965771,1.579218353,1.694725049,1.899833068,2.144597055,2.36135384,2.443256683,2.429970606,2.389047323,2.337094852,2.250889541,2.188023993,2.13709052,2.099164715,2.076452804,2.024539995,2.021619134,1.9640886,1.982727073,1.926210197,1.842392017,1.806117889,1.679763077,1.511954001,1.488087896,1.463900733,1.392996047,1.392446814,1.408225455,1.366500266,1.366991593,1.323501786,1.328421259,1.283301606,1.221515587,1.163565048,1.104206074,1.212667026,1.320275768,1.231614033,1.179235015,1.089487356,1.06737061,1.080671896,1.128244761,1.210865354,1.152818204,1.194097704,1.255155475,1.23573158,1.208040743,1.155226777,1.143065341,1.09352155,1.061488059,1.057188145,1.029102644,1.04703344,1.186813888,1.411701959,1.555970989,1.556947683,1.576481234,1.814533405,1.928581486,1.819682086,1.736688372,1.635362854,1.536750762,1.479566667,1.473344828,1.423645161,1.407485714,1.374870968,1.409323529,1.425151515,1.462694444,1.517911765,1.471558824,1.442333333,1.43125,1.437483871,1.329909091,1.258866667,1.184454545,1.195121212,1.178333333,1.3116875,1.696394737,2.190840909,2.32925,2.29730303,2.2379375,2.14221875,2.012705882,1.89771875,1.760266667,1.666466667,1.701394737,1.90315,2.081529412,2.150617647,2.214266667,2.2266875,2.219625,2.261342857,2.32425,2.494705882,2.675371429,2.777225806,2.767321429,2.732129032,2.656466667,2.576964286,2.421032258,2.259451613,2.1878125,2.139878788,2.112533333,2.11925,2.134088235,2.095129032,2.093475,2.063214286,1.964333333,1.936,1.855947368,1.75745,1.731825,1.695444444,1.59447619,1.702866667,1.856371429,2.121978723,2.4089,2.578064516,2.568382353,2.544333333,2.503483871,2.4144375,2.215225806,2.062193548,1.947033333,1.887933333,1.672678571,1.609,1.614757576,1.613068966,1.639205882,1.692515152,1.746935484,1.78065625];
  data2009=[1.739466667,1.637833333,1.5961,1.514483871,1.49121875,1.460285714,1.440257143,1.51169697,1.467516129,1.433612903,1.453028571,1.521933333,1.519774194,1.528764706,1.46853125,1.4478125,1.389586207,1.306235294,1.278258065,1.207933333,1.173533333,1.154413793,1.106241379,1.144366667,1.115071429,1.066129032,1.121448276,1.117272727,1.224484848,1.150212121,1.162709677,1.11440625,1.118133333,1.1410625,1.14769697,1.134628571,1.167967742,1.13396875,1.16496875,1.16103125,1.179033333,1.230414634,1.31890625,1.347676471,1.313428571,1.258125,1.2179,1.168037037,1.121607143,1.127206897,1.139724138,1.113,1.041774194,1.100266667,1.0765,1.085272727,1.0963,1.135354839,1.18383871,1.220323529,1.293333333,1.314866667,1.322137931,1.278870968,1.270903226,1.348911765,1.361272727,1.421413793,1.478939394,1.524322581,1.541,1.5105,1.50271875,1.464774194,1.430322581,1.336586207,1.284733333,1.250166667,1.199,1.1912,1.190423077,1.18109375,1.1659375,1.1894375,1.227323529,1.31497561,1.395125,1.386666667,1.513828571,1.66816129,1.737076923,1.758206897,1.86319568,2.158223252,2.519822876,2.829116665,3.247439116,3.748119179,3.995755107,4.115133443,4.155376487,4.149619417,4.072230295,3.925498317,3.714054164,3.493133103,3.298786646,3.125919541,3.001251248,2.897283725,2.848671089,2.989808517,3.332808424,3.624148107,3.863487847,4.051886781,4.164665391,4.216940817,4.204651928,4.110755993,3.957543138,3.845592931,3.735753808,3.611294902,3.469405672,3.358434037,3.259480952,3.246486913,3.198856875,3.157569345,3.04362268,2.93728214,2.817250978,2.659258657,2.505607143,2.380741935,2.28316129,2.209423077,2.102933333,2.023769231,2.00759375,1.988769231,1.953,1.904413793,1.913736842,1.858885714,1.8101875,1.746764706,1.686441176,1.658225806,1.648942857,1.617435897,1.6443,1.687548387,1.673290323,1.669586207,1.641387097,1.5913125,1.529428571,1.5263,1.448172414,1.409969697,1.428424242,1.499645161,1.498322581,1.478107143,1.453678571,1.408258065,1.343125,1.326733333,1.3693125,1.459971429,1.542176471,1.679852941,1.768096774,1.778147059,1.745361111,1.756470588,1.7284375,1.73683871,1.729588235,1.746692308,1.724458333,1.72378125,1.75183871,1.73625,1.760806452,1.774322581,1.777896552,1.757205882,1.68278125,1.63934375,1.574029412,1.5608,1.53959375,1.472241379,1.427066667,1.38871875,1.37940625,1.342242424,1.35509375,1.3948,1.438870968,1.471151515,1.519714286,1.589888889,1.632103448,1.633714286,1.622666667,1.571866667,1.566642857,1.63878125,1.781333333,1.83090625,1.855166667,1.821821429,1.789354839,1.783533333,1.7775,1.73,1.627342857,1.586241379,1.623586207,1.586862069,1.4945,1.4085,1.382724138,1.3128,1.267740741,1.324354839,1.382375,1.389555556,1.401037037,1.395785714,1.401321429,1.400366667,1.412483871,1.405064516,1.377566667,1.291903226,1.233034483,1.404533333,1.410785714,1.3501875,1.32828125,1.2943,1.26959375,1.239733333,1.194939394,1.161090909,1.129939394,1.099774194,1.072,1.032032258,1.002258065,0.9934375,1.0284,1.030212121,1.039035714,1.046125,1.064941176,1.116351351,1.101694444,1.095903226,1.06828125,1.029241379,1.001,0.971129032,0.930653846,0.87140625,0.951592593,0.99916129,1.077133333,1.1146,1.136032258,1.237548387,1.241322581,1.382096774,1.570774194,1.648,1.837967742,1.9589,2.001483871,1.99984375,1.9492,1.9062,1.912785714,1.887310345,1.8775,1.885111111,1.798176471,1.7764375,1.73234375,1.676333333,1.59675,1.568806452,1.576545455,1.833,2.015407407,2.0396875,2.013965517,1.979892857,1.970333333,1.9265,1.936064516,1.926466667,1.9288125,1.88730303,1.84,1.80209434,1.730882353,1.676480769,1.57684,1.537166667,1.485230769,1.438857143,1.39956,1.38918,1.41475,1.69954,1.894142857,1.92854,1.87976,1.8783,1.854615385,1.83209434,1.771117647,1.649490196,1.59345098,1.58227451,1.58425,1.634557692,1.681462963,1.772673077,1.889153846,1.93804,2.027098039,2.17527451,2.29216,2.400254902,2.39772549,2.347,2.28212,2.258396226,2.10962069,1.977781818,1.83552,1.797730769,1.75544898,1.71,1.682145833,1.62166,1.585235294,1.548078431,1.5,1.44196,1.464076923,1.43898,1.383588235,1.331641509,1.32744,1.38654902,1.444019231,1.439846154,1.45946];
  data2010=[1.484842883,1.590869075,1.737134035,1.816479989,1.821819397,1.787347825,1.729248595,1.671796872,1.611685179,1.516154994,1.450218166,1.390519296,1.356257258,1.343335892,1.339859754,1.318258669,1.285850354,1.298220238,1.339510602,1.304283822,1.256155126,1.218321392,1.190676172,1.128617821,1.131781622,1.278551104,1.431492485,1.591270296,1.677684561,1.642918333,1.690400707,1.743163172,1.746669736,1.748639359,1.708497419,1.621124758,1.545472487,1.492672483,1.434450281,1.392528481,1.372796925,1.404526137,1.396623303,1.37932825,1.407619333,1.41197816,1.404968098,1.395354578,1.387121693,1.38226345,1.347868411,1.328906931,1.30778938,1.266483407,1.276387662,1.286531228,1.357586137,1.480254781,1.605176781,1.734291854,1.784502815,1.78058374,1.778651799,1.771047146,1.706136878,1.615281675,1.559030329,1.510578236,1.453716712,1.389994144,1.356143261,1.321430729,1.315096157,1.347926768,1.373984966,1.390942315,1.427309399,1.507352859,1.570402073,1.619526597,1.671629853,1.698760866,1.905320049,2.045875153,2.086600034,2.162131102,2.142964482,2.169399048,2.420643473,2.820033643,3.037071629,3.111889508,3.122802358,3.169230484,3.216682697,3.282383415,3.355098636,3.415196626,3.449489762,3.486836309,3.529309222,3.586196726,3.600525237,3.553482117,3.479031105,3.364127801,3.277394212,3.172085589,3.015725644,2.871514673,2.746926177,2.626603424,2.542943331,2.501334505,2.486001873,2.457985274,2.453449257,2.449630201,2.407054275,2.341025761,2.292790334,2.192558462,2.110481987,2.005794677,1.905889104,1.827660233,1.773866746,1.733129374,1.782330525,1.740619036,1.732432504,1.720100285,1.671506495,1.690873879,1.705626114,1.686097828,1.631250423,1.60502034,1.597249622,1.607687306,1.531925374,1.482442918,1.422817238,1.409900449,1.426618392,1.43011663,1.417229648,1.379752905,1.353031498,1.33632906,1.270482767,1.243978029,1.265043721,1.248704935,1.2701887,1.327551146,1.438525856,1.595148988,1.706110921,1.703167122,1.680837232,1.677697283,1.650166854,1.587961037,1.591433209,1.58822447,1.53547595,1.524905946,1.506062212,1.409899415,1.359634049,1.317645843,1.315741417,1.310298927,1.290684219,1.27254855,1.263046794,1.275464873,1.318071966,1.388835467,1.382533311,1.314171344,1.261988417,1.227145042,1.187249266,1.175848762,1.127660101,1.117858986,1.096493433,1.076726893,1.125997112,1.232332426,1.325131099,1.406427296,1.461876794,1.525387444,1.528884175,1.5340702,1.520825146,1.478657569,1.452868644,1.357214512,1.354195196,1.359751736,1.359503563,1.371092926,1.357686681,1.320811053,1.27279307,1.273599147,1.233830189,1.211326923,1.16858,1.091403846,1.033245283,1.016470588,0.994884615,1.02182,1.0239,1.024784314,1.055442308,1.135039216,1.189862745,1.225884615,1.23378,1.195849057,1.159803922,1.127849057,1.086415094,1.057264151,1.010057692,0.9896,0.970333333,0.947509434,0.941245283,0.939509804,0.939192308,0.95816,0.968442308,0.948557692,0.931641509,0.937173077,0.938826923,0.957277778,0.950679245,0.929769231,0.962711538,0.944777778,0.972735849,0.991339623,1.034113208,1.115921569,1.17336,1.222568627,1.239647059,1.206215686,1.167811321,1.136830189,1.08442,1.078038462,1.05175,1.025192308,1.017862745,1.023333333,1.020150943,1.012588235,1.006145455,1.049673077,1.050196078,1.042384615,1.031653846,1.0534,1.110196078,1.223655172,1.387894737,1.527203704,1.649461538,1.75482,1.860745098,1.985491228,2.028272727,2.073111111,2.075288462,2.039313725,1.997039216,1.925115385,1.831204082,1.748407407,1.77786,1.724711538,1.667288462,1.668269231,1.687433962,1.708529412,1.693943396,1.666303571,1.608686275,1.578470588,1.604519231,1.545924528,1.569865385,1.62374,1.627821429,1.607705882,1.610185185,1.565176471,1.54274,1.57828,1.844389831,2.199615385,2.309307692,2.507763636,2.751096154,2.869438596,2.942264151,2.842730769,2.710019608,2.574,2.432588235,2.308692308,2.254867925,2.254392157,2.261611111,2.264777778,2.208326923,2.187076923,2.198408163,2.191054545,2.137653846,2.159980392,2.161622642,2.06608,1.950333333,1.883461538,1.849653846,1.845574074,1.95816,2.117192308,2.298666667,2.52062069,2.7296,2.807230769,2.751173077,2.645038462,2.521192308,2.365096154,2.362754386,2.771096774,3.358630769,3.57135,3.577363636,3.506882353,3.390166667,3.276672727,3.228,3.189537037,3.130641509,3.043078431,2.931745098,2.801480769,2.700019608,2.5,2.360941176,2.183846154,2.05122];

	function createGraph(layername){

		queriedYear = parseInt(document.getElementById("ADCPyear").value);
		var time = eval("time"+layername);

		var data = eval("data"+queriedYear);

		var pointData=[];

		var explanations = '<span class="modal-body" style="color:#dc4120" id = "ModalLegendText">Hover over the red dots to find out the date for which there is data available<br>Click on a red dot to bring data to the map</span>';



		var verticalLines=[];
		footerText='';
		for (i=0;i<time.length;i++){

			if (time[i].getFullYear()==queriedYear){
				var month = time[i].getMonth();
				month = month+1
				footerText=footerText+time[i].getDate()+'-'+month+'-'+queriedYear+', ';
				verticalLines.push(dayofyear(time[i]));

			}


		}
		//document.getElementById("ModalFoot").innerHTML ='Days Available (dd/mm/yyyy): <span style="color:#dc4120">'+footerText+'</span>';
		document.getElementById("closeModalBtn").innerHTML='Close';
		document.getElementById("closeModalBtn").onclick = '';

		if(verticalLines.length==0){
			document.getElementById("ModalTitle").innerHTML ='No Data Available for '+queriedYear;

			document.getElementById("ModalGraph").innerHTML ='Please select another year';

			document.getElementById("ModalLegend").innerHTML="";

		}

		else{

		document.getElementById("ModalTitle").innerHTML ='Data Available - '+queriedYear;

		document.getElementById("ModalGraph").innerHTML ='<canvas id="canvas"></canvas>';

		document.getElementById("ModalLegend").innerHTML = explanations;

		//var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

		var dayLabels = [];

		var add=false;

		var d = new Date("January 1,"+queriedYear)
		for (var i = 1; i <= 365; i++) {
			for (var j = 0; j < verticalLines.length; j++) {
				if (verticalLines[j]==i){
					pointData.push(0)
					add=true;
				}
		}
			if(add==false){
				pointData.push(null)
			} else{add=false}

			dayLabels.push((d.toDateString()).substring(4,d.toDateString().length-5))
			d.setDate(d.getDate() + 1);

		}

		var customTooltips = function(tooltip) {
			// Tooltip Element
			var tooltipEl = document.getElementById("ModalFoot");

			if (!tooltipEl) {
				tooltipEl = document.createElement('div');
				tooltipEl.id = 'chartjs-tooltip';
				tooltipEl.innerHTML = '<table></table>';
				this._chart.canvas.parentNode.appendChild(tooltipEl);
			}

			// Hide if no tooltip
			if (tooltip.opacity === 0) {
				tooltipEl.style.opacity = 0;
				return;
			}

			// Set caret Position
			tooltipEl.classList.remove('above', 'below', 'no-transform');
			if (tooltip.yAlign) {
				tooltipEl.classList.add(tooltip.yAlign);
			} else {
				tooltipEl.classList.add('no-transform');
			}

			function getBody(bodyItem) {
				return bodyItem.lines;
			}

			// Set Text
			if (tooltip.body) {
				var titleLines = tooltip.title || [];
				var bodyLines = tooltip.body.map(getBody);

				var innerHtml = '<thead>';

				titleLines.forEach(function(title) {
					innerHtml += '<tr><th><span style="color:red">' + title + ' -</span></th></tr>';
				});
				innerHtml += '</thead><tbody>';

				if (bodyLines[1]==null){
					//tooltipEl.innerHTML = innerHtml+" No data Available";
					tooltipEl.innerHTML = "";
					}
				else{




					var style = 'background:white';
					style += '; border-color:red';
					style += '; color:red';
					style += '; border-width: 2px';
					innerHtml += '<span style="' + style + '"> Data Available</span>';
					//innerHtml += '<tr style="' + style +'><td>' + span + '- Data Available' + '</td></tr>';

				innerHtml += '</tbody>';

				tooltipEl.innerHTML = innerHtml;}
			}

			var positionY = this._chart.canvas.offsetTop;
			var positionX = this._chart.canvas.offsetLeft;

			// Display, position, and set styles for font
			tooltipEl.style.opacity = 1;
			tooltipEl.style.left = positionX + tooltip.caretX + 'px';
			tooltipEl.style.top = positionY + tooltip.caretY + 'px';
			tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
			tooltipEl.style.fontSize = '16px';
			tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
			tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
		};

		var canvas = document.getElementById("canvas");
		var ctx = canvas.getContext("2d");



		var myChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: dayLabels,
					datasets: [{
						label: "River Level (m)",
						backgroundColor: window.chartColors.blue,
						borderColor: window.chartColors.blue,
						data:
							data
						,
						fill: false

					},
					{
						label: 'Data',
						backgroundColor: window.chartColors.red,
						borderColor: window.chartColors.red,
						data: pointData,
						fill: false,
						pointRadius: 5,
						pointHoverRadius: 15,
						showLine: false // no line shown

					}]
				},
				options: {
					spanGaps: true,
					responsive: true,
					legend: {
                        display: false
                    },
					title:{
						display:false,
					},
					tooltips: {
						enabled: false,
						mode: 'index',
						position: 'nearest',
						custom: customTooltips
					},
					hover: {
						mode: 'nearest',
						intersect: true
					},
					scales: {
						xAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Date'
							},
							ticks: {
                            callback: function(dataLabel, index) {
                                // Hide the label of every 2nd dataset. return null to hide the grid line too
                               return index % 4 === 0 ? dataLabel : '';
                            }
                        }

						}],
						yAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'River level (m)'
							}
						}]
					}
				},
			 lineAtIndex: verticalLines
		});

		window.myLine=myChart;



		canvas.onclick = function(evt) {
			var activePoints = myChart.getElementsAtEvent(evt);
			if (activePoints[0]) {
				var chartData = activePoints[0]['_chart'].config.data;
				var idx = activePoints[0]['_index'];
				var label = chartData.labels[idx];

				var month = label.substring(0,3);
				var day =label.substring(4,6);
				var value = chartData.datasets[0].data[idx];
				var url = "http://example.com/?label=" + label + "&value=" + value;

				var buttonLoadData='<button class="btn btn-primary" style="margin-left:10px" onclick="setLayer2(\''+layername+'\','+day+'\,'+'\''+month+'\')">Load Data on the Map</button>';


				document.getElementById("ModalLegend").innerHTML=explanations+'<br> Date Selected: '+ label +buttonLoadData;
      }
    };
		}
	}







var weatherURL = 'http://climate.weather.gc.ca/climate_data/daily_data_e.html?hlyRange=|&'
function onEachFeatureWeather(feature, layer) {
				var name = feature.properties.stationname;
				var id = feature.properties.stationid;
				var elevation = feature.properties.elevation;
				var lat = feature.geometry.coordinates[1];
				var lng = feature.geometry.coordinates[0];
				var startdate=feature.properties.startdate;
				var enddate=feature.properties.finishdate;
				var interval=feature.properties.interval;
				var data=feature.properties.availabledata;
				data=data.replace('{', '');
				data=data.replace('}', '');
				var dataArray=data.split(",");

				var startdatenotime = startdate.substring(0, 10);
				var startyear=startdate.substring(0, 4);
				var startmonth=startdate.substring(5, 7);
				var startday=startdate.substring(8, 10);

				var startdatetime = startdate.substring(11,16);
				var enddatetime=enddate.substring(11, 16);

				var enddatenotime=enddate.substring(0, 10);
				var endyear=enddate.substring(0, 4);
				var endmonth=enddate.substring(5, 7);
				var endday=enddate.substring(8, 10);

				var startDateTime = '<form target="_blank" name="datetime" action="datetime.py" method="get">Select start date and time: <input type="date" max="'+enddatenotime+'" min="'+startdatenotime+'" name="startdate" value="'+startdatenotime+'"><input type="time" name="starttime" value="'+startdatetime+'">';
				var endDateTime = 'Select end date and time: <input type="date" min="'+startdatenotime+'" max="'+enddatenotime+'" name="enddateinput" value="'+enddatenotime+'"><input type="time" name="endtime" value="'+enddatetime+'"><input type="submit" value="Get Data" style="margin-left:50px" class="btn btn-primary">';
				var buttonDateTime = '</form><button class="btn btn-primary" style="margin-left:10px" onclick=window.open("http://131.202.94.74/metadata/Technical_Documentation.pdf","_blank")>Metadata</button>';

				//Link the time frame (depending if it is hourly or daily), and the entered details for each inputbox
				var url = weatherURL+'StationID='+id+'&Prov=NB&urlExtension=_e.html&searchType=stnName&selRowPerPage=25&Line=0&searchMethod=contains&txtStationName='+name+'&timeframe=2&Day=29&Year=2016&Month=2#'
				url=encodeURI(url);
				var buttonWeb = '</form><button class="btn btn-primary" style="margin-left:10px" onclick=window.open(\'' + url + '\',"_blank")>Access data</button>';

				popuptext='<p><b>Name:</b> '+name+'<br/><b>Elevation:</b> '+elevation+'<br/><b>Lat:</b> '+lat+'<br/><b>Lon:</b> '+lng+'</p>';
                popupOptions = {maxWidth: 200};
                layer.bindPopup(popuptext
                    ,popupOptions)
					.on('popupopen', function (popup) {
						var checkstring='';
						for (i=0; i<dataArray.length;i++){
							checkstring=checkstring+createCheckBox(dataArray[i]);
						}
						document.getElementById("accordionText").innerHTML ='<b>Data is available from </b> '+startdatetime+'/'+startday+'/'+startyear+'<b> to </b> '+endmonth+'/'+endday+'/'+endyear+' in a  '+interval+' interval.<br/>'+startDateTime+' '+endDateTime+'<br/><b>Available Data: </b><br/>'+checkstring+'<br/> '+buttonDateTime+buttonWeb;
						openbigtab();
    }).on('popupclose', function (popup) {
						document.getElementById("accordionText").innerHTML ='';
						closetab();
    });
}

function onEachFeatureWater(feature, layer) {
    var name = feature.properties.stationname;
				var number = feature.properties.stationnumber;
				number = number.replace('\ufeff', '');
				var lat = feature.geometry.coordinates[1];
				var lng = feature.geometry.coordinates[0];
				var startyear=feature.properties.startyear;
				var endyear=feature.properties.finishyear;
				var drainage=feature.properties.drainagearea;
				var stationdatum=feature.properties.datum;
				var realTime = feature.properties.realtime;

				popuptext='<p><b>Name:</b> '+name+'<br/><b>Station Number:</b> '+number+'<br/><b>Lat:</b> '+lat+'<br/><b>Lon:</b> '+lng+'<br/><b>Drainage area:</b> '+drainage+'</p>';
                popupOptions = {maxWidth: 200};
                layer.bindPopup(popuptext
                    ,popupOptions)
					.on('popupopen', function (popup) {

						//var container = document.getElementById("accordionText");
						/*var checkstring='';
						for (i=0; i<dataArray.length;i++){
							//checkstring=checkstring+createCheckBox(dataArray[i]);
						}*/
						var buttonRealTime='';
						if (realTime=='Y'){
						var buttonRealTime=createButtonResult('Get Real Time data',1,number,startyear,endyear);}
						var buttonHistorical=createButtonResult('Get Historical data',2,number,startyear,endyear);
						var buttonMetadata ='<button class="btn btn-primary" style="margin-left:10px" onclick=window.open("http://131.202.94.74/metadata/hydrometric.pdf","_blank")>Metadata</button>';
						document.getElementById("accordionText").innerHTML ='<b>Data is available from </b> '+startyear+'<b> to </b> '+endyear+'<br/><br/>'+buttonRealTime+buttonHistorical+buttonMetadata;
						opensmalltab();
    }).on('popupclose', function (popup) {
						document.getElementById("accordionText").innerHTML ='';
						closetab();
    });

}

function onEachFeaturebuoys(feature, layer) {
    var name = feature.properties.buoyname;
	var lat = feature.geometry.coordinates[1];
	var lng = feature.geometry.coordinates[0];
	var provider=feature.properties.provider;
	var waterdepth=feature.properties.waterdepth;
	var data=feature.properties.sensors;
				data=data.replace('{', '');
				data=data.replace('}', '');
				var dataArray=data.split(",");
	var urlLink = feature.properties.link;

				popuptext='<p><b>Name:</b> '+name+'<br/><b>Provider:</b> '+provider+'<br/><b>Lat:</b> '+lat+'<br/><b>Lon:</b> '+lng+'<br/><b>Water depth [m]:</b> '+waterdepth+'</p>';
                popupOptions = {maxWidth: 200};
                layer.bindPopup(popuptext
                    ,popupOptions)
					.on('popupopen', function (popup) {

						var container = document.getElementById("accordionText");
						var checkstring='<br/>';
						for (i=0; i<dataArray.length;i++){
							var string  = '<span style="margin-left:10px" name="'+dataArray[i]+'" value="on">'+dataArray[i]+'<span/>';
							checkstring=checkstring+string;
						}
						//checkstring=checkstring+'</br>';
						var buttonBuoy='<button style="margin-left:40px" type="button" onclick=window.open(\''+urlLink+'\',"_blank") class="btn btn-primary custombtn" value="buoy">Access buoy Data</button>'

						document.getElementById("accordionText").innerHTML ='<p><b>Sensors available:</b> '+checkstring+buttonBuoy;
						opensmalltab();
    }).on('popupclose', function (popup) {
						document.getElementById("accordionText").innerHTML ='';
						closetab();
    });

}

function onEachFeaturetidal(feature, layer) {

	var name = feature.properties.stationname;
	var lat = feature.geometry.coordinates[1]+'º N';
	var lng = feature.geometry.coordinates[0]+'º W';
	var provider=feature.properties.owner;
	var datum=feature.properties.datum;
	var urlLink = feature.properties.link;

	popuptext='<p><b>Name:</b> '+name+'<br/><b>Provider:</b> '+provider+'<br/><b>Latitude:</b> '+lat+'<br/><b>Longitude:</b> '+lng+'<br/><b>Datum:</b> '+datum+'</p>';
	popuptext=popuptext+'<button type="button" onclick=window.open(\''+urlLink+'\',"_blank") class="btn btn-primary custombtn" value="tideGauge">Access Station Data</button>'
                popupOptions = {maxWidth: 200};
                layer.bindPopup(popuptext,popupOptions);


}

function createButtonResult (value,i,stn,sy,ey){
		var string  = '<button style="margin-left:10px" type="button" onclick="openwebpage('+i+',\'' + stn + '\''+',\'' + sy + '\''+',\'' + ey + '\')" class="btn btn-primary custombtn" name="'+value+'" value="'+value+'">'+value+'</button>';
		return string;
	}

function openwebpage(value,number,sy,ey){
	if (value==1){

		string = 'https://wateroffice.ec.gc.ca/search/real_time_results_e.html?search_type=station_number&station_number='+number;
		window.open(string,"_blank")
	}
	else{
		string = 'https://wateroffice.ec.gc.ca/search/historical_results_e.html?search_type=station_number&station_number='+number+'&start_year='+sy+'&end_year='+ey;
		window.open(string,"_blank")
	}
}


//load_wfs('oceanMapping:weatherStations');
//load_wfs('oceanMapping:waterlevelstations',2);


//map.on('moveend', load_wfs);

function load_wfs(layername) {
    //if (map.getZoom() > start_at_zoom) {
        var geoJsonUrl = wfsURL;

		var defaultParameters = {
			service : 'WFS',
			version : '1.0.0',
			request : 'GetFeature',
			typeName : layername,
			outputFormat : 'text/javascript',
			format_options : 'callback:getJson',
			srsName : 'EPSG:4326',

		};
//

        var customParams = {
            bbox: bboxvar
        };

        var parameters = L.Util.extend(defaultParameters,customParams);
        console.log(geoJsonUrl + L.Util.getParamString(parameters));


        $.ajax({
            url: geoJsonUrl + L.Util.getParamString(parameters),
            dataType: 'jsonp',
            jsonpCallback: 'getJson',
            success: function (response) {

					weatherStations.addData(response);



            }
        });

    /*} else {
        alert("please zoom in to see the polygons!");
        featureLayer.clearLayers();
    }*/
}

var defaultParameters2 = {
    service : 'WFS',
    version : '1.0.0',
    request : 'GetFeature',
    typeName : 'oceanMapping:waterlevelstations',
    outputFormat : 'text/javascript',
    format_options : 'callback:getJson2',
    srs : 'EPSG:4326',
	bbox: bboxvar
};

var parameters2 = L.Util.extend(defaultParameters2);
var URL = wfsURL + L.Util.getParamString(parameters2);

/*var ajax = $.ajax({
    url : URL,
    dataType : 'jsonp',
    jsonpCallback : 'getJson2',
    success : function (response) {
        hydrometricStations.addData(response);
    }
});*/

var defaultParameters3 = {
    service : 'WFS',
    version : '1.0.0',
    request : 'GetFeature',
    typeName : 'oceanMapping:buoys',
    outputFormat : 'text/javascript',
    format_options : 'callback:getJson3',
    srs : 'EPSG:4326',
	bbox: bboxvar
};

var parameters3 = L.Util.extend(defaultParameters3);
var URL = wfsURL + L.Util.getParamString(parameters3);

/*var ajax = $.ajax({
    url : URL,
    dataType : 'jsonp',
    jsonpCallback : 'getJson3',
    success : function (response) {
        buoys.addData(response);
    }
});

var defaultParameters4 = {
    service : 'WFS',
    version : '1.0.0',
    request : 'GetFeature',
    typeName : 'oceanMapping:tidalStations',
    outputFormat : 'text/javascript',
    format_options : 'callback:getJson4',
    srs : 'EPSG:4326',
	bbox: bboxvar
};

var parameters4 = L.Util.extend(defaultParameters4);
var URL = wfsURL + L.Util.getParamString(parameters4);

var ajax = $.ajax({
    url : URL,
    dataType : 'jsonp',
    jsonpCallback : 'getJson4',
    success : function (response) {
        tidalStations.addData(response);
    }
});*/

function dayofyear(date){
	var timestmp = new Date().setFullYear(date.getFullYear(),0,1);
	var yearFirstDay = Math.floor(timestmp/86400000);
	var today = Math.ceil(date.getTime()/86400000);
	var dayOfYear = today -yearFirstDay;
	return dayOfYear;
}

function julianIntToDate(n) {
    // convert a Julian number to a Gregorian Date.
    //    S.Boisseau / BubblingApp.com / 2014
    var a = n + 32044;
    var b = Math.floor(((4*a) + 3)/146097);
    var c = a - Math.floor((146097*b)/4);
    var d = Math.floor(((4*c) + 3)/1461);
    var e = c - Math.floor((1461 * d)/4);
    var f = Math.floor(((5*e) + 2)/153);

    var D = e + 1 - Math.floor(((153*f) + 2)/5);
    var M = f + 3 - 12 - Math.round(f/10);
    var Y = (100*b) + d - 4800 + Math.floor(f/10);

    return new Date(Y,M,D);
}

function zoomArea(){
	//Set the map bounds
	map.fitBounds(bounds);

	}

//loadwfs2("oceanMapping:mvp_polygons");

//Trying to load surveys as polygons
function loadwfs2(layername) {
    //if (map.getZoom() > start_at_zoom) {
        var geoJsonUrl = wfsURL;

		console.log(geoJsonUrl);

		if (layername=="oceanMapping:mvp_polygons_dateend"){

		var defaultParameters11 = {
			service : 'WFS',
			version : '1.0.0',
			request : 'GetFeature',
			typeName : layername,
			outputFormat : 'text/javascript',
			format_options : 'callback:getJson5',
			srsName : 'EPSG:4326',

		};}
		else{
			var defaultParameters11 = {
				service : 'WFS',
				version : '1.0.0',
				request : 'GetFeature',
				typeName : layername,
				outputFormat : 'text/javascript',
				format_options : 'callback:getJson6',
				srsName : 'EPSG:4326',

			};
		}
//
        var customParams = {
            bbox: bboxvar
        };

        var parameters = L.Util.extend(defaultParameters11,customParams);
        console.log(geoJsonUrl + L.Util.getParamString(parameters));

				if (layername=="oceanMapping:mvp_polygons_dateend"){
        $.ajax({
            url: geoJsonUrl + L.Util.getParamString(parameters),
						dataType: 'jsonp',
						jsonpCallback: 'getJson5',
            success: function (response) {

					survey.addData(response);

				//	map.addLayer(survey);
				// layer_control.addOverlay(survey, "lala Stations");


            }
        });}else{
					$.ajax({
	            url: geoJsonUrl + L.Util.getParamString(parameters),
							dataType: 'jsonp',
							jsonpCallback: 'getJson6',
	            success: function (response) {

									surveyadcp.addData(response);


						//map.addLayer(surveyadcp);
					// layer_control.addOverlay(survey, "lala Stations");


	            }
	        });

				}

    /*} else {
        alert("please zoom in to see the polygons!");
        featureLayer.clearLayers();
    }*/
}



function pop_Surveys(feature, layer) {

	names[n] = feature.properties['Project'];

	dates[n] = feature.properties['date'].substring(0, 4);

	date = feature.properties['date'].substring(0, 10);
	dateend=feature.properties['dateend'].substring(0, 10);
	/*	layer.on({
			mouseout: function(e) {
				layer.setStyle(style_Surveys(feature));
			},
			mouseover: highlightFeature
		});
		var popupContent = '<table style="margin: 0; padding: 0;">\
			<tr>\
				<td colspan="2"><span style="font-weight: bold; font-size: 14px"></span></td>\
			</tr>\
			</table>';
		layer.bindPopup(popupContent);
	}*/

	layers[n] = new L.GeoJSON(
		feature, {

			onEachFeature: function(f,l){
				l.on({
					mouseout: function(e) {
					l.setStyle(style_Surveys());
					},
					mouseover: highlightFeature
				});
			},
			style:style_Surveys

	});



		var popupContent = '<table style="margin: 0; padding: 0;">\
			<tr>\
				<td colspan="2"><span style="font-weight: bold; font-size: 14px">' +names[n] + '</span></td>\
			</tr>\
			<tr>\
				<td colspan="2"><span style="font-weight: bold; font-size: 14px">' +date + '</span></td>\
			</tr>\
			<tr>\
				<td colspan="2"><button type="button" onclick="wmsRequest( \'' + date + '\','+n+',\''+ dateend+'\')" class="btn btn-primary custombtn" value="tideGauge">Access Survey Data</button></td>\
			</tr>\
			</table>';
		layers[n].bindPopup(popupContent);

		n=n+1;
	}

	function pop_Surveys2(feature, layer) {

		namesADCP[n2] = feature.properties['objectid'];

		datesADCP[n2] = feature.properties['date'].substring(0, 4);

		dateADCP = feature.properties['date'].substring(0, 10);
		dateendADCP=feature.properties['date_end'].substring(0, 10);

		layersADCP[n2] = new L.GeoJSON(
			feature, {

				onEachFeature: function(f,l){
					l.on({
						mouseout: function(e) {
						l.setStyle(style_Surveys());
						},
						mouseover: highlightFeature
					});
				},
				style:style_Surveys

		});

			var popupContent = '<table style="margin: 0; padding: 0;">\
				<tr>\
					<td colspan="2"><span style="font-weight: bold; font-size: 14px">' +namesADCP[n2] + '</span></td>\
				</tr>\
				<tr>\
					<td colspan="2"><span style="font-weight: bold; font-size: 14px">' +dateADCP + '</span></td>\
				</tr>\
				<tr>\
					<td colspan="2"><button type="button" onclick="wmsRequest2( \'' + dateADCP + '\','+n2+',\''+ dateendADCP+'\')" class="btn btn-primary custombtn" value="tideGauge">Access Survey Data</button></td>\
				</tr>\
				</table>';
			layersADCP[n2].bindPopup(popupContent);

			n2=n2+1;
		}

	/*Define style for SJRPolygons0*/
	/*The following two style parameters are set to variables since they are used in both style_Surveys and listMouseOut/listMouseOver*/
	var styleColor = 'rgba(165,191,221)';
	var styleOpacity = 0.4;

function style_Surveys(feature) {
		return {
			opacity: 1,
			color: 'rgba(84,98,97,1.0)',
			dashArray: '',
			lineCap: 'butt',
			lineJoin: 'miter',
			weight: 1.0,
			fillOpacity: styleOpacity,
			fillColor: styleColor,
		}
	}

	/*The function highlightFeature is used to highlight a polygon on mouseover*/
	var highlightLayer;
	function highlightFeature(e) {
		highlightLayer = e.target;

		if (e.target.feature.geometry.type === 'LineString') {
			highlightLayer.setStyle({
				color: '#ffff00',
			});
		} else {
			highlightLayer.setStyle({
				fillColor: '#ffff00',
				fillOpacity: 0.6
			});
		}
	}

	function wmsRequest(date,n,dateend){
		//console.log(date);
		mvp_points._source._overlay.setParams({time: date+'/'+dateend});
		map.fitBounds(layers[n].getBounds());

		/*layers[n].on({
						mouseout: function(e) {
						layers[n].setStyle(style_Surveys2());
						},
						mouseover: function(e) {
						layers[n].setStyle(style_Surveys2());
						},

					});*/

		for (i = 0; i < layers.length; i++) {
					var date = Number(dates[i]);
					if(i==n){
						map.removeLayer(layers[i])
					}
					else{
						map.removeLayer(layers[i])
					}

				}

		if (map.hasLayer(mvp_points)){
		}
		else{
			layer_control.addOverlay(mvp_points,"MVP_Points");
			mvp_points.addTo(map);
		}

	}

	function wmsRequest2(date,n,dateend){
		//console.log(date);
		adcp_points._source._overlay.setParams({time: date+'/'+dateend});
		map.fitBounds(layersADCP[n].getBounds());

		/*layers[n].on({
						mouseout: function(e) {
						layers[n].setStyle(style_Surveys2());
						},
						mouseover: function(e) {
						layers[n].setStyle(style_Surveys2());
						},

					});*/

		for (i = 0; i < layersADCP.length; i++) {
					var date = Number(datesADCP[i]);
					if(i==n){
						map.removeLayer(layersADCP[i])
					}
					else{
						map.removeLayer(layersADCP[i])
					}

				}

		if (map.hasLayer(adcp_points)){
		}
		else{
			layer_control.addOverlay(adcp_points,"ADCP_Points");
			adcp_points.addTo(map);
		}

	}

	/*The two functions below are used to highlight a polygon on mouseover in the layers list*/
	function listMouseOver(n) {
		layers[n].setStyle({fillColor: '#ffff00', fillOpacity: 0.6});
	}
	function listMouseOut(n) {
		layers[n].setStyle({fillColor: styleColor,fillOpacity: styleOpacity});
	}

	function style_Surveys2() {
		return {
			opacity: 1,
			color: 'rgba(84,98,97,1.0)',
			dashArray: '',
			lineCap: 'butt',
			lineJoin: 'miter',
			weight: 1.0,
			fillOpacity: 0,
			fillColor: styleColor,
		}
	}

	function removePolygonsMVP(){
		//Remove polygons from map
		for (i = 0; i < layers.length; i++) {
			layer_control.removeLayer(layers[i])
			map.removeLayer(layers[i])
		}
	}

	function removePolygonsADCP(){
		//Remove polygons from map
		for (i = 0; i < layersADCP.length; i++) {
			layer_control.removeLayer(layersADCP[i])
			map.removeLayer(layersADCP[i])
		}
	}
