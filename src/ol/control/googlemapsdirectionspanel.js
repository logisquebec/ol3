goog.provide('ol.control.GoogleMapsDirectionsPanel');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('ol.Collection');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Overlay');
goog.require('ol.OverlayPositioning');
goog.require('ol.View2D');
goog.require('ol.control.Control');
goog.require('ol.extent');
goog.require('ol.proj');


/**
 * @define {number} Default xize in pixels of the top-left, top-right,
 * bottom-left and bottom-right corners where a popup position should never
 * be.  This should set around half the size of the popup.
 */
ol.control.GOOGLEMAPSDIRECTIONSPANEL_CORNER_PIXEL_SIZE = 100;


/**
 * @define {number} Default buffer size in pixels to apply to the map view
 * extent when checking if a coordinate is in the extent.
 */
ol.control.GOOGLEMAPSDIRECTIONSPANEL_PIXEL_BUFFER = 30;



/**
 * Todo
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.GoogleMapsDirectionsPanelOptions=} opt_options Options.
 */
ol.control.GoogleMapsDirectionsPanel = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var classPrefix = 'ol-gmdp';

  /**
   * @type {string}
   * @private
   */
  this.classPrefix_ = classPrefix;


  /**
   * @type {number}
   * @private
   */
  this.cornerPixelSize_ = goog.isDefAndNotNull(options.cornerPixelSize) ?
      options.cornerPixelSize :
      ol.control.GOOGLEMAPSDIRECTIONSPANEL_CORNER_PIXEL_SIZE;


  /**
   * @type {number}
   * @private
   */
  this.pixelBuffer_ = goog.isDefAndNotNull(options.pixelBuffer) ?
      options.pixelBuffer : ol.control.GOOGLEMAPSDIRECTIONSPANEL_PIXEL_BUFFER;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + ' ' + ol.css.CLASS_UNSELECTABLE
  });


  /**
   * The container element for the route selector
   * @type {Element}
   * @private
   */
  this.routeSelectorEl_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-selector'
  });
  goog.dom.appendChild(element, this.routeSelectorEl_);

  var routeSelectorToggleEl = goog.dom.createDom(goog.dom.TagName.A, {
    'class': classPrefix + '-selector-toggle'
  });
  // todo - i18n
  goog.dom.appendChild(routeSelectorToggleEl, goog.dom.createTextNode(
      'Suggested routes'));
  goog.dom.appendChild(this.routeSelectorEl_, routeSelectorToggleEl);

  /**
   * The container element for route to select
   * @type {Element}
   * @private
   */
  this.routeSelectorListEl_ = goog.dom.createDom(goog.dom.TagName.OL, {
    'class': classPrefix + '-selector-list'
  });
  goog.dom.appendChild(this.routeSelectorEl_, this.routeSelectorListEl_);


  /**
   * The container element for routes
   * @type {Element}
   * @private
   */
  this.routesEl_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-routes'
  });
  goog.dom.appendChild(element, this.routesEl_);


  /**
   * A collection of LegHeader, Tail and Step that can be clicked to show
   * a popup on the map.  Keep track of them in order to listen and unlisten
   * to browser events accordingly.
   * @type {ol.Collection}
   * @private
   */
  this.clickableDirectionElements_ = new ol.Collection();


  var popupEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-popup ' + ol.css.CLASS_UNSELECTABLE
  });

  /**
   * @type {ol.Overlay}
   * @private
   */
  this.popup_ = new ol.Overlay({
    element: popupEl,
    positioning: ol.OverlayPositioning.BOTTOM_CENTER,
    stopEvent: false
  });

  /**
   * @type {string}
   * @private
   */
  this.popupPlacement_ = 'top';

  goog.base(this, {
    element: element,
    target: options.target
  });

};
goog.inherits(ol.control.GoogleMapsDirectionsPanel, ol.control.Control);


/**
 * i18n - around
 * @type {string}
 */
ol.control.GoogleMapsDirectionsPanel.prototype.aroundText = 'environ';


/**
 * i18n - copyright
 * @type {string}
 */
ol.control.GoogleMapsDirectionsPanel.prototype.copyrightText =
    'Données cartographiques ©2014 Google';


/**
 * i18n - copyright
 * @type {string}
 */
ol.control.GoogleMapsDirectionsPanel.prototype.totalDistanceText =
    'Distance Totale';


/**
 * Clear the current directions.
 */
ol.control.GoogleMapsDirectionsPanel.prototype.clearDirections = function() {

  // browse LegHeader, Tail and Step elements that had events listeners
  // to unlisten them
  this.clickableDirectionElements_.forEach(function(element) {
    goog.events.unlisten(element, [
      goog.events.EventType.TOUCHEND,
      goog.events.EventType.CLICK
    ], this.handleElementPress_, false, this);
  }, this);
  this.clickableDirectionElements_.clear();

  // todo - do the same for selector elements

  // remove children
  goog.dom.removeChildren(this.routesEl_);
  goog.dom.removeChildren(this.routeSelectorListEl_);

  // destroy popup
  this.destroyPopup_();
};


/**
 * Build the direction panel content using the passed direction results.
 * @param {google.maps.DirectionsResult} directionsResult
 */
ol.control.GoogleMapsDirectionsPanel.prototype.setDirections = function(
    directionsResult) {

  var routesEl = this.routesEl_;
  var routeSelectorListEl = this.routeSelectorListEl_;
  var routeEl;
  var classPrefix = this.classPrefix_;

  // first, clear any previous direction infos
  this.clearDirections();

  // add routes
  goog.array.forEach(directionsResult.routes, function(route) {
    routeEl = this.createRouteElement_(route);
    goog.dom.appendChild(routesEl, routeEl);

    goog.dom.appendChild(
        routeSelectorListEl,
        this.createRouteSelectorItemElement_(route)
    );
  }, this);

  // copyright
  var copyright = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-copyright'
  });
  goog.dom.appendChild(routesEl, copyright);
  var copyrightText = goog.dom.createTextNode(this.copyrightText);
  goog.dom.appendChild(copyright, copyrightText);

};


/**
 * Create all elements required for a route
 * @param {google.maps.DirectionsRoute} route
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createRouteElement_ =
    function(route) {

  var legEl;
  var tailEl;
  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-route'
  });

  // total distance
  var totalDistanceText = this.totalDistanceText + ': ' +
      this.calculateRouteTotalDistance_(route);
  var totalDistanceEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-route-total-distance'
  });
  goog.dom.appendChild(element, totalDistanceEl);
  goog.dom.appendChild(
      totalDistanceEl, goog.dom.createTextNode(totalDistanceText));

  // legs
  goog.array.forEach(route.legs, function(leg) {
    legEl = this.createLegElement_(leg);
    goog.dom.appendChild(element, legEl);
  }, this);

  // tail
  var lastLeg = goog.array.peek(route.legs);
  goog.asserts.assertObject(lastLeg);
  tailEl = this.createTailElement_(lastLeg);
  goog.dom.appendChild(element, tailEl);

  return element;
};


/**
 * Create all elements required for a route for the selector list.
 * @param {google.maps.DirectionsRoute} route
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createRouteSelectorItemElement_ =
    function(route) {

  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.LI, {
    'class': classPrefix + '-selector-item'
  });

  // info
  var infoEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-selector-item-info'
  });
  goog.dom.appendChild(element, infoEl);

  // total distance
  var totalDistanceEl = goog.dom.createDom(goog.dom.TagName.SPAN);
  goog.dom.appendChild(totalDistanceEl,
      goog.dom.createTextNode(this.calculateRouteTotalDistance_(route)));
  goog.dom.appendChild(infoEl, totalDistanceEl);

  goog.dom.appendChild(infoEl, goog.dom.createTextNode(', '));

  // total duration
  var totalDurationEl = goog.dom.createDom(goog.dom.TagName.SPAN);
  goog.dom.appendChild(totalDurationEl,
      goog.dom.createTextNode(this.calculateRouteTotalDuration_(route)));
  goog.dom.appendChild(infoEl, totalDurationEl);

  // summary
  if (goog.isDefAndNotNull(route.summary)) {
    var summaryEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-selector-item-summary'
    });
    goog.dom.appendChild(element, summaryEl);
    goog.dom.appendChild(summaryEl, goog.dom.createTextNode(route.summary));
  }

  return element;
};


/**
 * Create all elements required for a leg
 * @param {Object} leg
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createLegElement_ =
    function(leg) {

  var stepEl;
  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-leg'
  });

  // header
  goog.dom.appendChild(element, this.createLegHeaderElement_(leg, true));

  // summary
  var summaryEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-leg-summary'
  });
  goog.dom.appendChild(element, summaryEl);
  var summaryText = goog.dom.createTextNode(
      leg.distance.text + ' - ' + this.aroundText + ' ' + leg.duration.text);
  goog.dom.appendChild(summaryEl, summaryText);

  // steps
  var table = goog.dom.createDom(goog.dom.TagName.TABLE, {
    'class': classPrefix + '-steps'
  });
  goog.dom.appendChild(element, table);

  goog.array.forEach(leg.steps, function(step, index) {
    stepEl = this.createStepElement_(step, index);
    goog.dom.appendChild(table, stepEl);
  }, this);

  return element;
};


/**
 * Create the header for a leg
 * @param {Object} leg
 * @param {boolean} start Whether to use the start address or not (use end)
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createLegHeaderElement_ =
    function(leg, start) {

  var classPrefix = this.classPrefix_;

  var map = this.getMap();

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);

  var projection = view2D.getProjection();

  var lat = (start) ? leg.start_location.lat() : leg.end_location.lat();
  var lng = (start) ? leg.start_location.lng() : leg.end_location.lng();
  var transformedCoordinate = ol.proj.transform(
      [lng, lat], 'EPSG:4326', projection.getCode());

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-leg-header',
    'data-x': transformedCoordinate[0],
    'data-y': transformedCoordinate[1],
    'data-instructions': (start) ? leg.start_address : leg.end_address
  });

  // icon - todo

  // text
  var textEl = goog.dom.createDom(goog.dom.TagName.DIV, {});
  goog.dom.appendChild(element, textEl);
  var text = (start) ? leg.start_address : leg.end_address;
  goog.dom.appendChild(textEl, goog.dom.createTextNode(text));

  // event listeners
  goog.events.listen(element, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleElementPress_, false, this);

  this.clickableDirectionElements_.push(element);

  return element;
};


/**
 * Create all elements required for a tail, which is the last leg of a route
 * @param {Object} leg
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createTailElement_ =
    function(leg) {

  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-tail'
  });

  // header
  goog.dom.appendChild(element, this.createLegHeaderElement_(leg, false));

  return element;
};


/**
 * Create all elements required for a step
 * @param {google.maps.DirectionsStep} step
 * @param {number} index Index of step
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createStepElement_ =
    function(step, index) {

  var classPrefix = this.classPrefix_;

  var map = this.getMap();

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);

  var projection = view2D.getProjection();

  var lat = step.start_location.lat();
  var lng = step.start_location.lng();
  var transformedCoordinate = ol.proj.transform(
      [lng, lat], 'EPSG:4326', projection.getCode());

  var element = goog.dom.createDom(goog.dom.TagName.TR, {
    'class': classPrefix + '-step',
    'data-x': transformedCoordinate[0],
    'data-y': transformedCoordinate[1],
    'data-instructions': step.instructions
  });

  // maneuver
  var maneuverEl = goog.dom.createDom(goog.dom.TagName.TD, {
    'class': classPrefix + '-step-maneuver'
  });
  if (goog.isDefAndNotNull(step.maneuver)) {
    goog.dom.classes.add(maneuverEl,
        classPrefix + '-step-maneuver-' + step.maneuver);
  }
  goog.dom.appendChild(element, maneuverEl);

  // num
  var numEl = goog.dom.createDom(goog.dom.TagName.TD, {
    'class': classPrefix + '-step-num'
  });
  numEl.innerHTML = goog.string.makeSafe(index + 1 + '.');
  goog.dom.appendChild(element, numEl);

  // instructions
  var instructionsEl = goog.dom.createDom(goog.dom.TagName.TD, {
    'class': classPrefix + '-step-instructions'
  });
  instructionsEl.innerHTML = step.instructions;
  goog.dom.appendChild(element, instructionsEl);

  // distance
  var distanceEl = goog.dom.createDom(goog.dom.TagName.TD, {
    'class': classPrefix + '-step-distance'
  });
  distanceEl.innerHTML = step.distance.text;
  goog.dom.appendChild(element, distanceEl);

  // event listeners
  goog.events.listen(element, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleElementPress_, false, this);

  this.clickableDirectionElements_.push(element);

  return element;
};


/**
 * @param {ol.Coordinate} coordinate Coordinate used to position the popup
 * @param {string} content Content of the popup, can be html
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createPopup_ = function(
    coordinate, content) {

  var popup = this.popup_;
  var popupEl = popup.getElement();

  // destroy old one first
  $(popupEl).popover('destroy');

  // set position
  popup.setPosition(coordinate);

  // set content and show using popover (requires bootstrap)
  jQuery(popupEl).popover({
    'animation': false,
    'placement': this.popupPlacement_,
    'html': true,
    'content': content
  });

  window.setTimeout(function() {
    jQuery(popupEl).popover('show');
  }, 50);
};


/**
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.destroyPopup_ = function() {
  var popup = this.popup_;
  var popupEl = popup.getElement();
  jQuery(popupEl).popover('destroy');
};


/**
 * Check if a popup can be safely shown at the specified coordinate.
 * It can't if:
 *  - it's outside the extent of the view of the map, including a buffer
 *  - it's in one of the 4 corner extents where there wouldn't be enough
 *    space to show the popup.
 * @param {ol.Coordinate} coordinate in map view projection
 * @return {boolean}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.coordinateIsPopupSafe_ =
    function(coordinate) {

  var map = this.getMap();

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);

  var size = map.getSize();
  goog.asserts.assertArray(size);

  var extent = view2D.calculateExtent(size);

  var resolution = view2D.getResolutionForExtent(extent, size);
  var pixelBuffer = this.pixelBuffer_;
  var buffer = resolution * pixelBuffer;

  var smallExtent = ol.extent.buffer(extent, buffer * -1);

  // popup is not safe if too close to the edge of the map, which is
  // calculated using buffer
  if (!ol.extent.containsCoordinate(smallExtent, coordinate)) {
    return false;
  }

  var cornerPixelSize = this.cornerPixelSize_;
  var cornerSize = resolution * cornerPixelSize;

  var outerBottomLeft = ol.extent.getBottomLeft(extent);
  var outerTopRight = ol.extent.getTopRight(extent);

  var outerLeft = outerBottomLeft[0];
  var outerBottom = outerBottomLeft[1];
  var outerRight = outerTopRight[0];
  var outerTop = outerTopRight[1];

  var innerLeft = outerLeft + cornerSize;
  var innerBottom = outerBottom + cornerSize;
  var innerRight = outerRight - cornerSize;
  var innerTop = outerTop - cornerSize;

  var topLeftCorner = ol.extent.createOrUpdate(
      outerLeft, innerTop, innerLeft, outerTop);

  var topRightCorner = ol.extent.createOrUpdate(
      innerRight, innerTop, outerRight, outerTop);

  var bottomLeftCorner = ol.extent.createOrUpdate(
      outerLeft, outerBottom, innerLeft, innerBottom);

  var bottomRightCorner = ol.extent.createOrUpdate(
      innerRight, outerBottom, outerRight, innerBottom);

  // popup is not safe if coordinate is inside one of the 4 corners of the map
  if (ol.extent.containsCoordinate(topLeftCorner, coordinate) ||
      ol.extent.containsCoordinate(topRightCorner, coordinate) ||
      ol.extent.containsCoordinate(bottomLeftCorner, coordinate) ||
      ol.extent.containsCoordinate(bottomRightCorner, coordinate)) {
    return false;
  }

  return true;
};


/**
 * Calculate and set the best possible positioning of the popup given a
 * specific coordinate.
 * @param {ol.Coordinate} coordinate in map view projection
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.calculatePopupPositioning_ =
    function(coordinate) {

  var map = this.getMap();

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);

  var size = map.getSize();
  goog.asserts.assertArray(size);

  var extent = view2D.calculateExtent(size);

  var resolution = view2D.getResolutionForExtent(extent, size);

  var cornerPixelSize = this.cornerPixelSize_;
  var cornerSize = resolution * cornerPixelSize;

  var outerBottomLeft = ol.extent.getBottomLeft(extent);
  var outerTopRight = ol.extent.getTopRight(extent);

  var outerLeft = outerBottomLeft[0];
  var outerBottom = outerBottomLeft[1];
  var outerRight = outerTopRight[0];
  var outerTop = outerTopRight[1];

  var innerLeft = outerLeft + cornerSize;
  var innerRight = outerRight - cornerSize;
  var innerTop = outerTop - cornerSize;

  // Here's a preview of the 4 extents, i.e. 'zones'.
  // The bottom one is bigger to have highest priority for popups with the
  // arrow pointing down in most cases
  //
  // -------------
  // | |___t___| |
  // |l|       |r|
  // | |   b   | |
  // -------------

  var bottomExtent = ol.extent.createOrUpdate(
      innerLeft, outerBottom, innerRight, innerTop);

  var topExtent = ol.extent.createOrUpdate(
      innerLeft, innerTop, innerRight, outerTop);

  var leftExtent = ol.extent.createOrUpdate(
      outerLeft, outerBottom, innerLeft, outerTop);

  var rightExtent = ol.extent.createOrUpdate(
      innerRight, outerBottom, outerRight, outerTop);

  if (ol.extent.containsCoordinate(bottomExtent, coordinate)) {
    this.popupPlacement_ = 'top';
    this.popup_.setPositioning(ol.OverlayPositioning.BOTTOM_CENTER);
  } else if (ol.extent.containsCoordinate(topExtent, coordinate)) {
    this.popupPlacement_ = 'bottom';
    this.popup_.setPositioning(ol.OverlayPositioning.TOP_CENTER);
  } else if (ol.extent.containsCoordinate(leftExtent, coordinate)) {
    this.popupPlacement_ = 'right';
    this.popup_.setPositioning(ol.OverlayPositioning.CENTER_LEFT);
  } else if (ol.extent.containsCoordinate(rightExtent, coordinate)) {
    this.popupPlacement_ = 'left';
    this.popup_.setPositioning(ol.OverlayPositioning.CENTER_RIGHT);
  } else {
    this.resetPopupPositioning_();
  }

};


/**
 * Calculate and returns the total distance of a route as plain text.
 * @param {google.maps.DirectionsRoute} route
 * @return {string}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.calculateRouteTotalDistance_ =
    function(route) {

  var totalDistance = 0;
  var totalDistanceText;

  goog.array.forEach(route.legs, function(leg) {
    totalDistance += leg.distance.value;
  }, this);

  if (totalDistance > 100) {
    // todo - add i18n related formats for numbers
    totalDistanceText = goog.string.makeSafe(
        Math.round(totalDistance / 1000 * 10) / 10 + ' km');
  } else {
    totalDistanceText = goog.string.makeSafe(totalDistance + ' m');
  }

  return totalDistanceText;
};


/**
 * Calculate and returns the total duration of a route as plain text.
 * @param {google.maps.DirectionsRoute} route
 * @return {string}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.calculateRouteTotalDuration_ =
    function(route) {

  var totalDuration = 0;
  var totalDurationContent = [];

  goog.array.forEach(route.legs, function(leg) {
    totalDuration += leg.duration.value;
  }, this);

  if (totalDuration > 3600) {
    var hours = Math.floor(totalDuration / 3600);
    var remainingDuration = totalDuration - hours * 3600;
    totalDurationContent.push(hours);

    // todo - i18n
    var hoursSuffix = 'heure';
    hoursSuffix += (hours > 1) ? 's' : '';
    totalDurationContent.push(hoursSuffix);
  } else {
    remainingDuration = totalDuration;
  }

  var minutes = Math.floor(remainingDuration / 60);
  totalDurationContent.push(minutes);

  // todo - i18n
  var minutesSuffix = ' minute';
  minutesSuffix += (minutes > 1) ? 's' : '';
  totalDurationContent.push(minutesSuffix);

  return goog.string.makeSafe(totalDurationContent.join(' '));
};


/**
 * Reset the popup positioning to the default values.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.resetPopupPositioning_ =
    function() {
  this.popupPlacement_ = 'top';
  this.popup_.setPositioning(ol.OverlayPositioning.BOTTOM_CENTER);
};


/**
 * @inheritDoc
 */
ol.control.GoogleMapsDirectionsPanel.prototype.setMap = function(map) {

  var myMap = this.getMap();
  if (goog.isNull(map) && !goog.isNull(myMap)) {
    myMap.removeOverlay(this.popup_);

    goog.events.unlisten(
        myMap,
        ol.MapBrowserEvent.EventType.SINGLECLICK,
        this.handleMapSingleClick_, false, this);

    this.clearDirections();
  }

  goog.base(this, 'setMap', map);

  if (!goog.isNull(map)) {
    map.addOverlay(this.popup_);

    goog.events.listen(
        map,
        ol.MapBrowserEvent.EventType.SINGLECLICK,
        this.handleMapSingleClick_, false, this);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.handleElementPress_ =
    function(browserEvent) {

  browserEvent.preventDefault();

  var element = browserEvent.currentTarget;
  var map, view, view2D;

  // get coordinate from element
  var coordinate = [
    parseFloat(element.getAttribute('data-x')),
    parseFloat(element.getAttribute('data-y'))
  ];

  if (this.coordinateIsPopupSafe_(coordinate)) {
    this.calculatePopupPositioning_(coordinate);
  } else {
    this.resetPopupPositioning_();

    map = this.getMap();

    view = map.getView();
    goog.asserts.assert(goog.isDef(view));
    view2D = view.getView2D();
    goog.asserts.assertInstanceof(view2D, ol.View2D);

    view2D.setCenter(coordinate);
  }

  this.createPopup_(coordinate, element.getAttribute('data-instructions'));
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.handleMapSingleClick_ =
    function(event) {

  this.destroyPopup_();
};
