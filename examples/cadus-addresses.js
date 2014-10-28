// NOCOMPILE
// This example uses the GMapx v3 API, which we do not have an exports file for.
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.GoogleMapsAddresses');
goog.require('ol.control.GoogleMapsCurrentPosition');
goog.require('ol.interaction');
goog.require('ol.interaction.DragPan');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.GeoJSON');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var gmap = new google.maps.Map(document.getElementById('gmap'), {
  disableDefaultUI: true,
  keyboardShortcuts: false,
  draggable: false,
  disableDoubleClickZoom: true,
  scrollwheel: false,
  streetViewControl: false
});

var view = new ol.View();
view.on('change:center', function() {
  var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
  gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
});
view.on('change:resolution', function() {
  gmap.setZoom(view.getZoom());
});

var vector = new ol.layer.Vector({
  source: new ol.source.GeoJSON(({
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
  })),
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

var olMapDiv = document.getElementById('olmap');
var map = new ol.Map({
  layers: [vector],
  interactions: ol.interaction.defaults({
    altShiftDragRotate: false,
    dragPan: false,
    touchRotate: false
  }).extend([new ol.interaction.DragPan({kinetic: false})]),
  renderer: 'canvas',
  target: olMapDiv,
  view: view
});
view.setCenter([-7910219, 6176130]);
view.setZoom(14);

olMapDiv.parentNode.removeChild(olMapDiv);
gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);

var olCurrentPosition = new ol.control.GoogleMapsCurrentPosition({
  'geocoderComponentRestrictions': {'country': 'CA'},
  'currentPositionText': 'Ma position'
});

var olAdresses = new ol.control.GoogleMapsAddresses({
  'target': 'gmaps-geocoder',
  'addressesTarget': 'addresses',
  'enableCurrentPosition': true,
  'currentPositionControl': olCurrentPosition,
  'searchButtonText': 'Rechercher',
  'clearButtonText': 'Effacer',
  'homeAddressButtonText': 'Adresse de domicile',
  'addButtonText': 'Ajouter une addresse',
  'editButtonText': 'Modifier l\'addresse',
  'cancelEditButtonText': 'Annuler la modification',
  'noResultFoundText': 'Aucun résultat n\'a été trouvé',
  'getURL': 'data/cadus/addresses.json',
  'saveURL': 'data/cadus/addresses-save.json',
  'geocoderComponentRestrictions': {'country': 'CA'},
  'iconStyle': new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.75,
      src: 'data/icon.png'
    }))
  })
});
map.addControl(olAdresses);

var errorEl = document.getElementById('gmaps-geocoder-error');
var error = '';
olAdresses.on(
    ol.control.GoogleMapsAddresses.EventType.ERROR,
    function() {
      error = olAdresses.getError();
      if (error === null) {
        error = '';
      }
      errorEl.innerHTML = error;
    }
);