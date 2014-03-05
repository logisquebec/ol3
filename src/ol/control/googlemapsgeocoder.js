goog.provide('ol.control.GoogleMapsGeocoder');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.string');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.View2D');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.proj');



/**
 * Todo
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.GoogleMapsGeocoderOptions=} opt_options Options.
 */
ol.control.GoogleMapsGeocoder = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = 'ol-google-maps-geocoder';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  });

  var input = goog.dom.createDom(goog.dom.TagName.INPUT, {
    'class': ''
  });
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': ''
  });
  var buttonText = goog.dom.createTextNode('GO');
  goog.dom.appendChild(button, buttonText);


  goog.dom.appendChild(element, input);
  goog.dom.appendChild(element, button);

  goog.events.listen(button, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleButtonPress_, false, this);

  goog.events.listen(input, [
    goog.events.EventType.KEYPRESS
  ], this.handleInputKeypress_, false, this);

  /**
   * @type {boolean}
   * @private
   */
  if (goog.isDefAndNotNull(options.enableReverseGeocoding) &&
      goog.isBoolean(options.enableReverseGeocoding)) {
    this.enableReverseGeocoding_ = options.enableReverseGeocoding;
  } else {
    this.enableReverseGeocoding_ = false;
  }

  /**
   * @type {Object}
   * @private
   */
  this.geocoderComponentRestrictions_ = goog.isDef(
      options.geocoderComponentRestrictions) ?
      options.geocoderComponentRestrictions : {};

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @private
   * @type {Element}
   */
  this.input_ = input;

  /**
   * @private
   * @type {google.maps.Geocoder}
   */
  this.geocoder_ = new google.maps.Geocoder();

};
goog.inherits(ol.control.GoogleMapsGeocoder, ol.control.Control);


/**
 * @inheritDoc
 */
ol.control.GoogleMapsGeocoder.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {

    if (this.enableReverseGeocoding_ == true) {
      goog.events.listen(map, [
        ol.MapBrowserEvent.EventType.SINGLECLICK
      ], this.handleMapSingleClick_, false, this);
    }
  }
};


/**
 * Disable reverse geocoding.
 */
ol.control.GoogleMapsGeocoder.prototype.disableReverseGeocoding = function() {
  var map;

  if (this.enableReverseGeocoding_ == true) {
    this.enableReverseGeocoding_ = false;
    map = this.getMap();
    goog.events.unlisten(map, [
      ol.MapBrowserEvent.EventType.SINGLECLICK
    ], this.handleMapSingleClick_, false, this);
  }
};


/**
 * Enable reverse geocoding.
 */
ol.control.GoogleMapsGeocoder.prototype.enableReverseGeocoding = function() {
  var map;

  if (this.enableReverseGeocoding_ == false) {
    this.enableReverseGeocoding_ = true;
    map = this.getMap();
    goog.events.listen(map, [
      ol.MapBrowserEvent.EventType.SINGLECLICK
    ], this.handleMapSingleClick_, false, this);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.GoogleMapsGeocoder.prototype.handleInputKeypress_ = function(
    browserEvent) {

  if (browserEvent.keyCode == goog.events.KeyCodes.ENTER) {
    this.handleButtonPress_(browserEvent);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.GoogleMapsGeocoder.prototype.handleButtonPress_ = function(
    browserEvent) {

  browserEvent.preventDefault();

  var input = this.input_;
  var value = input.value;
  if (!goog.string.isEmptySafe(value)) {
    this.geocodeByAddress_(value);
  }
};


/**
 * @param {String} address The address to search
 * @private
 */
ol.control.GoogleMapsGeocoder.prototype.geocodeByAddress_ = function(address) {

  var me = this;
  var geocoder = this.geocoder_;

  geocoder.geocode(
      {
        'address': address,
        'componentRestrictions': this.geocoderComponentRestrictions_
      },
      function(results, status) {
        me.handleGeocode_(results, status);
      }
  );
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser singleclick event.
 * @private
 */
ol.control.GoogleMapsGeocoder.prototype.handleMapSingleClick_ = function(
    mapBrowserEvent) {

  var map = this.getMap();

  var coordinate = mapBrowserEvent.coordinate;

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);

  var projection = view2D.getProjection();

  var transformedCoordinate = ol.proj.transform(
      coordinate, projection.getCode(), 'EPSG:4326'
      );

  this.geocodeByCoordinate_(transformedCoordinate);
};


/**
 * @param {ol.Coordinate} coordinate ready for use with GoogleMaps Geocoder,
 *     i.e. in LatLng projection.
 * @private
 */
ol.control.GoogleMapsGeocoder.prototype.geocodeByCoordinate_ = function(
    coordinate) {

  var me = this;
  var geocoder = this.geocoder_;
  var lat = coordinate[1];
  var lng = coordinate[0];
  var latlng = new google.maps.LatLng(lat, lng);

  geocoder.geocode(
      {
        'latLng': latlng,
        'componentRestrictions': this.geocoderComponentRestrictions_
      },
      function(results, status) {
        me.handleGeocode_(results, status);
      }
  );
};


/**
 * @param {Array} results
 * @param {number|string} status
 * @private
 */
ol.control.GoogleMapsGeocoder.prototype.handleGeocode_ = function(
    results, status) {

  var input = this.input_;

  var formatted_address, x, y;
  var result;
  var tmpOutput = [];

  if (status == google.maps.GeocoderStatus.OK) {
    if (results.length) {
      // TODO: support multiple results
      result = results[0];

      formatted_address = result.formatted_address;
      x = result.geometry.location.lng();
      y = result.geometry.location.lat();

      tmpOutput.push(formatted_address);
      tmpOutput.push('\n');
      tmpOutput.push('(');
      tmpOutput.push(x);
      tmpOutput.push(', ');
      tmpOutput.push(y);
      tmpOutput.push(')');

      //alert(tmpOutput.join(''));

      input.value = formatted_address;
    } else {
      // TODO: manage no results
      alert('No results found');
    }
  } else {
    // TODO: manage error message
    alert(
        'Geocode was not successful for the following reason: ' +
        status
    );
  }
};
