// NOCOMPILE
// This example uses the GMapx v3 API, which we do not have an exports file for.
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control.GoogleMapsGeocoder');
goog.require('ol.interaction');
goog.require('ol.interaction.DragPan');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.GeoJSON');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var gmap = new google.maps.Map(document.getElementById('map'), {
  center: new google.maps.LatLng(0, 0),
  zoom: 1,
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false
});

var olmap = document.createElement('div');
olmap.style['width'] = '100%';
olmap.style['height'] = '100%';
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olmap);

var olGeocoder;

google.maps.event.addListenerOnce(gmap, 'idle', function() {

  var vectorSource = new ol.source.GeoJSON(({
    object: {
      'type': 'FeatureCollection',
      'crs': {
        'type': 'name',
        'properties': {
          'name': 'EPSG:3857'
        }
      },
      'features': []
    }
  }));

  var dummy = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.6)'
      }),
      stroke: new ol.style.Stroke({
        color: '#319FD3',
        width: 1
      })
    })
  });

  var center = gmap.getCenter();
  var map = new ol.Map({
    layers: [dummy],
    interactions: ol.interaction.defaults({
      altShiftDragRotate: false,
      dragPan: false,
      touchRotate: false
    }).extend([new ol.interaction.DragPan({kinetic: false})]),
    renderer: 'canvas',
    target: olmap,
    view: new ol.View2D({
      center: ol.proj.transform([center.lng(), center.lat()],
          'EPSG:4326', 'EPSG:3857'),
      zoom: gmap.getZoom()
    })
  });

  var view = map.getView().getView2D();
  view.on('change:center', function() {
    var center = ol.proj.transform(view.getCenter(),
        'EPSG:3857', 'EPSG:4326');
    gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
  });
  view.on('change:resolution', function() {
    gmap.setZoom(view.getZoom());
  });

  olGeocoder = new ol.control.GoogleMapsGeocoder({
    'target': 'gmaps-geocoder'
  });
  map.addControl(olGeocoder);
});
