goog.provide('ol.control.GoogleMapsDirectionsPanel');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('goog.style');
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

  /**
   * i18n - around
   * @type {string}
   */
  this.aroundText = goog.isDef(options.aroundText) ?
      options.aroundText : 'about';

  /**
   * i18n - contact
   * @type {string}
   */
  this.contactText = goog.isDef(options.contactText) ?
      options.contactText : 'Contact';

  /**
   * i18n - copyright
   * @type {string}
   */
  this.copyrightText = goog.isDef(options.copyrightText) ?
      options.copyrightText : '©2014 Google';

  /**
   * i18n - pathDetails
   * @type {string}
   */
  this.pathDetailsText = goog.isDef(options.pathDetailsText) ?
      options.pathDetailsText : 'Path details';

  /**
   * i18n - ponctual
   * @type {string}
   */
  this.ponctualText = goog.isDef(options.ponctualText) ?
      options.ponctualText : 'Ponctual';

  /**
   * i18n - recurring
   * @type {string}
   */
  this.recurringText = goog.isDef(options.recurringText) ?
      options.recurringText : 'Recurring';

  /**
   * i18n - suggestedRoutes
   * @type {string}
   */
  this.suggestedRoutesText = goog.isDef(options.suggestedRoutesText) ?
      options.suggestedRoutesText : 'Suggested Routes';

  /**
   * i18n - totalDistance
   * @type {string}
   */
  this.totalDistanceText = goog.isDef(options.totalDistanceText) ?
      options.totalDistanceText : 'Total distance';

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
    'id': classPrefix + '-selector-toggle',
    'style': 'display:none',
    'class': classPrefix + '-selector-toggle-opened'
  });
  goog.events.listen(
      routeSelectorToggleEl,
      ol.MapBrowserEvent.EventType.CLICK,
      this.handleToggleElementPress_, false, this);

  goog.dom.appendChild(routeSelectorToggleEl, goog.dom.createTextNode(
      this.suggestedRoutesText));
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
   * A collection of route selector elements
   * @type {ol.Collection}
   * @private
   */
  this.clickableSelectorElements_ = new ol.Collection();


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
   * @type {ol.Collection}
   * @private
   */
  this.iconImageElements_ = new ol.Collection();


  /**
   * @type {ol.Collection}
   * @private
   */
  this.routes_ = new ol.Collection();


  /**
   * @type {?number}
   * @private
   */
  this.selectedRouteIndex_ = null;

  /**
   * How this widget behave when parsing the json response in setDirection
   * Possible values are:
   *  - 'simple': Directions panel will show basic route information
   *              with road summary of the selected route. First route
   *              is selected by default.
   *  - 'complex': Directions panel will show avalaible offer with the
   *               road summary if the more detail link is selected.
   * @type {string}
   * @private
   */
  this.mode_ = goog.isDef(options.mode) ?
      options.mode : ol.control.GoogleMapsDirectionsPanel.Mode.SIMPLE;


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
 * @enum {number}
 */
ol.control.GoogleMapsDirectionsPanel.Ambiance = {
  TALK: 1,
  MUSIC: 2,
  RADIO: 3
};


/**
 * @enum {string}
 */
ol.control.GoogleMapsDirectionsPanel.EventType = {
  HOVER: goog.events.getUniqueId('HOVER'),
  UNHOVER: goog.events.getUniqueId('UNHOVER'),
  SELECT: goog.events.getUniqueId('SELECT'),
  UNSELECT: goog.events.getUniqueId('UNSELECT')
};


/**
 * @enum {string}
 */
ol.control.GoogleMapsDirectionsPanel.Mode = {
  SIMPLE: 'simple',
  COMPLEX: 'complex'
};


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

  // unlisten selector elements too
  this.clickableSelectorElements_.forEach(function(element) {
    goog.events.unlisten(element, [
      goog.events.EventType.TOUCHEND,
      goog.events.EventType.CLICK
    ], this.handleSelectorElementPress_, false, this);
  }, this);
  this.clickableSelectorElements_.clear();

  // remove children
  goog.dom.removeChildren(this.routesEl_);
  goog.dom.removeChildren(this.routeSelectorListEl_);

  // destroy popup
  this.destroyPopup_();

  // clear routes and selected route
  this.routes_.clear();
  this.selectedRouteIndex_ = null;

  // clear icon images
  this.iconImageElements_.clear();

  //Hide suggested routes link
  this.selectorVisible_(false);
};


/**
 * Build the direction panel content using the passed direction results.
 * @param {google.maps.DirectionsResult|Object} directionsResult
 * @param {Array.<string>} imageSrc
 */
ol.control.GoogleMapsDirectionsPanel.prototype.setDirections = function(
    directionsResult, imageSrc) {

  var routesEl = this.routesEl_;
  var routeSelectorListEl = this.routeSelectorListEl_;
  var routeEl;
  var offerEl;
  var containerEl;
  var classPrefix = this.classPrefix_;
  var routeObj;

  // first, clear any previous direction infos
  this.clearDirections();

  // add routes
  goog.array.forEach(directionsResult.routes, function(route, index) {
    routeObj = {};
    routeObj.result = route;

    if (this.mode_ == ol.control.GoogleMapsDirectionsPanel.Mode.SIMPLE) {
      routeEl = this.createRouteElement_(route, index, imageSrc);
      goog.dom.appendChild(routesEl, routeEl);

      goog.dom.appendChild(
          routeSelectorListEl,
          this.createRouteSelectorItemElement_(route, index)
      );
    }
    else {
      containerEl = goog.dom.createDom(goog.dom.TagName.DIV, {
        'class': classPrefix + '-offer-result',
        'data-route-index': index
      });

      offerEl = this.createOfferElement_(route, index);
      goog.dom.appendChild(containerEl, offerEl);

      routeEl = this.createRouteElement_(route, index, imageSrc);
      goog.dom.appendChild(containerEl, routeEl);

      goog.dom.appendChild(routesEl, containerEl);
    }

    routeObj.directionEl = routeEl;

    this.routes_.push(routeObj);
  }, this);

  // copyright
  var copyright = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-copyright'
  });
  goog.dom.appendChild(routesEl, copyright);
  if (goog.isDefAndNotNull(this.copyrightText)) {
    var copyrightText = goog.dom.createTextNode(this.copyrightText);
    goog.dom.appendChild(copyright, copyrightText);
  }

  if (this.mode_ == ol.control.GoogleMapsDirectionsPanel.Mode.SIMPLE) {
    // set first route as default selection
    if (this.routes_.getLength()) {
      this.select_(0);
    }
    // Display the Suggested routes button
    this.selectorVisible_(true);
  }
};


/**
 * Returns the selected route results.  Useful for 'save' purpose.
 * @return {Object|boolean}
 */
ol.control.GoogleMapsDirectionsPanel.prototype.getSelectedRoute = function() {
  var routeResults = false;

  if (!goog.isNull(this.selectedRouteIndex_)) {
    routeResults = this.routes_.getAt(this.selectedRouteIndex_).result;
  }

  return routeResults;
};


/**
 * Returns the selected route index
 * @return {?number}
 */
ol.control.GoogleMapsDirectionsPanel.prototype.getSelectedRouteIndex =
    function() {
  return this.selectedRouteIndex_;
};


/**
 * Change all icon images src that are currently in DOM with those sent
 * @param {Array.<string>} iconImages The list of icons to use
 */
ol.control.GoogleMapsDirectionsPanel.prototype.setIconImages =
    function(iconImages) {

  var iconImage;

  this.iconImageElements_.forEach(function(iconImageEl, index) {
    iconImage = iconImages[index];
    if (goog.isDefAndNotNull(iconImage)) {
      iconImageEl.src = iconImage;
    }
  }, this);
};


/**
 * Create all elements required for a route
 * @param {google.maps.DirectionsRoute} route
 * @param {number} index
 * @param {Array.<string>} imgSrc
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createRouteElement_ =
    function(route, index, imgSrc) {

  var legEl;
  var tailEl;
  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-route',
    'style': 'display: none;',
    'data-route-index': index
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

  var legCounter = 0;

  // legs
  goog.array.forEach(route.legs, function(leg) {
    legEl = this.createLegElement_(leg, imgSrc[legCounter]);
    goog.dom.appendChild(element, legEl);
    legCounter++;
  }, this);

  // tail
  var lastLeg = route.legs[route.legs.length - 1];
  tailEl = this.createTailElement_(lastLeg, imgSrc[legCounter]);
  goog.dom.appendChild(element, tailEl);

  return element;
};


/**
 * Create all element required for an offer
 * @param {google.maps.DirectionsRoute} route
 * @param {number} index
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createOfferElement_ =
    function(route, index) {

  var leftCtnEl;
  var rightCtnEl;
  var classPrefix = this.classPrefix_;

  var elementClasses = [];
  elementClasses.push(classPrefix + '-offer');
  if (index % 2 === 0) {
    elementClasses.push(classPrefix + '-offer-even');
  } else {
    elementClasses.push(classPrefix + '-offer-odd');
  }
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': elementClasses.join(' ')
  });

  // numEl
  var numEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-offer-num'
  });
  goog.dom.appendChild(element, numEl);
  goog.dom.appendChild(numEl, goog.dom.createTextNode(index + 1));

  // if route has any 'mt_*' property, that means the response comes
  // from the multimodal service
  if (goog.isDef(route.mt_usager)) {

    // == LEFT START ==
    leftCtnEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-offer-left'
    });
    goog.dom.appendChild(element, leftCtnEl);

    // -- user picture --
    var userPic = goog.dom.createDom(goog.dom.TagName.IMG, {
      'src': route.mt_usager.mt_photo,
      'class': classPrefix + '-offer-user-pic'
    });
    goog.dom.appendChild(leftCtnEl, userPic);

    // -- user full name --
    var userFullNameEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-offer-header'
    });
    goog.dom.appendChild(leftCtnEl, userFullNameEl);
    var userFullNameText = route.mt_usager.mt_first_name + ' ' +
        route.mt_usager.mt_last_name;
    goog.dom.appendChild(userFullNameEl, goog.dom.createTextNode(
        userFullNameText));

    // -- user eval --
    var userEvalClasses = [];
    userEvalClasses.push(classPrefix + '-offer-user-eval');
    userEvalClasses.push(classPrefix + '-offer-user-eval-' +
        route.mt_usager.mt_evaluation);
    var userEvalEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': userEvalClasses.join(' ')
    });
    goog.dom.appendChild(userEvalEl, goog.dom.createTextNode(' '));
    goog.dom.appendChild(leftCtnEl, userEvalEl);

    // small icons
    goog.dom.appendChild(leftCtnEl, this.createOfferIconElement_(
        'driver', route.mt_offre.mt_est_conducteur));
    goog.dom.appendChild(leftCtnEl, this.createOfferIconElement_(
        'seats', route.mt_offre.mt_places_dispo));
    goog.dom.appendChild(leftCtnEl, this.createOfferIconElement_(
        'smoking', route.mt_offre.mt_fume));
    // ambiance icons
    var offreAmbiance = route.mt_offre.mt_atmosphere;
    var ambiance = ol.control.GoogleMapsDirectionsPanel.Ambiance;
    var talkAmbiance = (offreAmbiance === ambiance.TALK) ? '1' : '0';
    goog.dom.appendChild(leftCtnEl, this.createOfferIconElement_(
        'talk', talkAmbiance));
    var musicAmbiance = (offreAmbiance === ambiance.MUSIC) ? '1' : '0';
    goog.dom.appendChild(leftCtnEl, this.createOfferIconElement_(
        'music', musicAmbiance));
    var radioAmbiance = (offreAmbiance === ambiance.RADIO) ? '1' : '0';
    goog.dom.appendChild(leftCtnEl, this.createOfferIconElement_(
        'radio', radioAmbiance));

    // -- clear left --
    var clearEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-clear-left'
    });
    goog.dom.appendChild(leftCtnEl, clearEl);

    // == LEFT END ==

    // == RIGHT START ==
    rightCtnEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-offer-right'
    });
    goog.dom.appendChild(element, rightCtnEl);

    // -- line 1 --
    var firstLineEl = goog.dom.createDom(goog.dom.TagName.DIV, {});
    goog.dom.appendChild(rightCtnEl, firstLineEl);

    var offerTypeText = (route.mt_offre.mt_horaire_ponctuelle === 1) ?
        this.ponctualText : this.recurringText;
    var offerTypeEl = goog.dom.createDom(goog.dom.TagName.SPAN, {});
    goog.dom.appendChild(firstLineEl, offerTypeEl);
    goog.dom.appendChild(offerTypeEl, goog.dom.createTextNode(offerTypeText));

    goog.dom.appendChild(firstLineEl, this.createOfferPipeElement_());

    var dateText = route.mt_offre.mt_date;
    var dateEl = goog.dom.createDom(goog.dom.TagName.SPAN, {
      'class': classPrefix + '-offer-header'
    });
    goog.dom.appendChild(firstLineEl, dateEl);
    goog.dom.appendChild(dateEl, goog.dom.createTextNode(dateText));

    goog.dom.appendChild(firstLineEl, this.createOfferPipeElement_());

    var hourText = route.mt_offre.mt_heure;
    var hourEl = goog.dom.createDom(goog.dom.TagName.SPAN, {
      'class': classPrefix + '-offer-header'
    });
    goog.dom.appendChild(firstLineEl, hourEl);
    goog.dom.appendChild(hourEl, goog.dom.createTextNode(hourText));

    // -- line 2 --
    var secondLineEl = goog.dom.createDom(goog.dom.TagName.DIV, {});
    goog.dom.appendChild(rightCtnEl, secondLineEl);

    var priceText = route.mt_offre.mt_prix;
    var priceEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-offer-header'
    });
    goog.dom.appendChild(rightCtnEl, priceEl);
    goog.dom.appendChild(priceEl, goog.dom.createTextNode(priceText));

    // organisation
    goog.array.forEach(route.mt_org, function(organisationName) {
      var orgApprovedEl = goog.dom.createDom(goog.dom.TagName.DIV, {
        'class': classPrefix + '-offer-group-approved-1'
      });
      goog.dom.appendChild(rightCtnEl, orgApprovedEl);

      var orgEl = goog.dom.createDom(goog.dom.TagName.DIV, {
        'class': classPrefix + '-offer-group'
      });
      goog.dom.appendChild(rightCtnEl, orgEl);
      goog.dom.appendChild(orgEl, goog.dom.createTextNode(organisationName));
    }, this);
  }
  // else, the response comes from Google Maps.  Style accordingly
  else {
    // only need the 'left' container, set class as 'single'
    leftCtnEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-offer-single'
    });
    goog.dom.appendChild(element, leftCtnEl);

    var summaryEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-offer-header'
    });
    goog.dom.appendChild(leftCtnEl, summaryEl);
    goog.dom.appendChild(summaryEl,
        goog.dom.createTextNode(route.summary));
  }

  if (goog.isDef(route.mt_usager)) {
    // -- clear left --
    var clearEl = goog.dom.createDom(goog.dom.TagName.DIV, {
      'class': classPrefix + '-clear-left'
    });
    goog.dom.appendChild(element, clearEl);
  }

  // detail link
  var detailLink = goog.dom.createDom(goog.dom.TagName.A, {
    'class': classPrefix + '-offer-details-link',
    'href': '#',
    'data-selector-index': index
  });
  goog.dom.appendChild(leftCtnEl, detailLink);
  goog.dom.appendChild(detailLink,
      goog.dom.createTextNode(this.pathDetailsText));

  // contact link
  if (goog.isDef(route.mt_usager)) {
    var contactLink = goog.dom.createDom(goog.dom.TagName.A, {
      'class': classPrefix + '-offer-contact-link',
      'href': 'mailto:' + route.mt_usager.mt_email
    });
    goog.dom.appendChild(leftCtnEl, contactLink);
    goog.dom.appendChild(contactLink,
        goog.dom.createTextNode(this.contactText));
  }

  // event listeners
  goog.events.listen(detailLink, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleSelectorElementPress_, false, this);

  return element;
};


/**
 * Create a simple pipe element for the offer
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createOfferPipeElement_ =
    function() {

  var classPrefix = this.classPrefix_;

  var pipeEl = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'class': classPrefix + '-offer-pipe'
  });
  goog.dom.appendChild(pipeEl, goog.dom.createTextNode('|'));

  return pipeEl;
};


/**
 * Create an offer icon element
 * @param {string} name Name of the property
 * @param {string} value Value
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createOfferIconElement_ =
    function(name, value) {

  var classPrefix = this.classPrefix_;

  var iconClasses = [];
  iconClasses.push(classPrefix + '-offer-icon');
  iconClasses.push(classPrefix + '-offer-icon-' + name + '-' + value);

  var iconEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': iconClasses.join(' ')
  });

  return iconEl;
};


/**
 * Create all elements required for a route for the selector list.
 * @param {google.maps.DirectionsRoute} route
 * @param {number} index
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createRouteSelectorItemElement_ =
    function(route, index) {

  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.LI, {
    'class': classPrefix + '-selector-item',
    'data-selector-index': index
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

  // event listeners
  goog.events.listen(element, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.handleSelectorElementPress_, false, this);

  goog.events.listen(element, [
    goog.events.EventType.MOUSEOVER
  ], this.handleSelectorElementHover_, false, this);

  goog.events.listen(element, [
    goog.events.EventType.MOUSEOUT
  ], this.handleSelectorElementUnhover_, false, this);



  this.clickableSelectorElements_.push(element);

  return element;
};


/**
 * Create all elements required for a leg
 * @param {google.maps.DirectionsLeg} leg
 * @param {string} imgSrc
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createLegElement_ =
    function(leg, imgSrc) {

  var stepEl;
  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-leg'
  });

  // header
  goog.dom.appendChild(element,
      this.createLegHeaderElement_(leg, true, imgSrc));

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
 * @param {google.maps.DirectionsLeg} leg
 * @param {boolean} start Whether to use the start address or not (use end)
 * @param {string} imgSrc
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createLegHeaderElement_ =
    function(leg, start, imgSrc) {

  var classPrefix = this.classPrefix_;

  var map = this.getMap();

  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  goog.asserts.assertInstanceof(view2D, ol.View2D);

  var projection = view2D.getProjection();

  // create start and end coordinates from start and end locations if
  // not existant to be able to use them later for save purpose
  if (goog.isDefAndNotNull(leg.start_location)) {
    // start
    var startLat = leg.start_location.lat();
    var startLng = leg.start_location.lng();
    leg.start_coordinate = ol.proj.transform(
        [startLng, startLat], 'EPSG:4326', projection.getCode());

    // end
    var endLat = leg.end_location.lat();
    var endLng = leg.end_location.lng();
    leg.end_coordinate = ol.proj.transform(
        [endLng, endLat], 'EPSG:4326', projection.getCode());
  }
  var coordinate = (start) ? leg.start_coordinate : leg.end_coordinate;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-leg-header',
    'data-x': coordinate[0],
    'data-y': coordinate[1],
    'data-instructions': (start) ? leg.start_address : leg.end_address
  });

  // text
  var textEl = goog.dom.createDom(goog.dom.TagName.DIV, {});
  goog.dom.appendChild(element, textEl);

  var iconEl = goog.dom.createDom(goog.dom.TagName.IMG, {
    'src': imgSrc,
    'class': classPrefix + '-leg-icon'
  });
  goog.dom.appendChild(textEl, iconEl);
  this.iconImageElements_.push(iconEl);

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
 * @param {google.maps.DirectionsLeg} leg
 * @param {string} imgSrc
 * @return {Element}
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.createTailElement_ =
    function(leg, imgSrc) {

  var classPrefix = this.classPrefix_;

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-tail'
  });

  // header
  goog.dom.appendChild(element,
      this.createLegHeaderElement_(leg, false, imgSrc));

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

  var coordinate;
  if (goog.isDefAndNotNull(step.start_location)) {
    var lat = step.start_location.lat();
    var lng = step.start_location.lng();
    coordinate = ol.proj.transform(
        [lng, lat], 'EPSG:4326', projection.getCode());
    // keep transformed coordinate for further saving purpose
    step.start_coordinate = coordinate;
  } else if (goog.isDefAndNotNull(step.start_coordinate)) {
    coordinate = step.start_coordinate;
  }

  var element = goog.dom.createDom(goog.dom.TagName.TR, {
    'class': classPrefix + '-step',
    'data-x': coordinate[0],
    'data-y': coordinate[1],
    'data-instructions': step.instructions
  });

  // maneuver
  var maneuverTDEl = goog.dom.createDom(goog.dom.TagName.TD);
  goog.dom.appendChild(element, maneuverTDEl);
  var maneuverEl = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': classPrefix + '-step-maneuver'
  });
  if (goog.isDefAndNotNull(step.maneuver) && step.maneuver !== '') {
    goog.dom.classes.add(maneuverEl,
        classPrefix + '-step-maneuver-' + step.maneuver);
  }
  goog.dom.appendChild(maneuverTDEl, maneuverEl);

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
 * Select a route, which displays its direction details.  Unselect any
 * previously selected route too.
 * @param {number} index Index of the route to select
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.select_ = function(index) {

  var route;

  // unselect first, if required
  if (!goog.isNull(this.selectedRouteIndex_) &&
      this.selectedRouteIndex_ != index) {
    //console.log("unselect: " + this.selectedRouteIndex_);

    // todo - set style to selector

    route = this.routes_.getAt(this.selectedRouteIndex_);

    // hide direction details
    goog.style.setStyle(route.directionEl, 'display', 'none');

    goog.events.dispatchEvent(this,
        ol.control.GoogleMapsDirectionsPanel.EventType.UNSELECT);

    this.destroyPopup_();

    this.selectedRouteIndex_ = null;
  }

  // select, if not already selected
  if (goog.isNull(this.selectedRouteIndex_) ||
      this.selectedRouteIndex_ != index) {
    //console.log("select: " + index);

    route = this.routes_.getAt(index);

    // todo - set style to selector

    // show direction details
    goog.style.setStyle(route.directionEl, 'display', '');

    this.selectedRouteIndex_ = index;

    goog.events.dispatchEvent(this,
        ol.control.GoogleMapsDirectionsPanel.EventType.SELECT);
  }
  else if (!goog.isNull(this.selectedRouteIndex_) &&
      this.selectedRouteIndex_ == index &&
      this.mode_ == ol.control.GoogleMapsDirectionsPanel.Mode.COMPLEX) {
    route = this.routes_.getAt(index);

    //toggle off the current direction detail
    goog.style.setStyle(route.directionEl, 'display', 'none');

    goog.events.dispatchEvent(this,
        ol.control.GoogleMapsDirectionsPanel.EventType.UNSELECT);

    this.destroyPopup_();

    //reset the selected route index
    this.selectedRouteIndex_ = null;
  }

  if (this.mode_ == ol.control.GoogleMapsDirectionsPanel.Mode.SIMPLE)
    this.selectSelectorItem_(index);
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
  var remainingDuration = 0;
  if (totalDuration > 3600) {
    var hours = Math.floor(totalDuration / 3600);
    remainingDuration = totalDuration - hours * 3600;
    totalDurationContent.push(hours);

    // todo - i18n
    var hoursSuffix = 'heure';
    hoursSuffix += (hours > 1) ? 's' : '';
    totalDurationContent.push(hoursSuffix);
  } else {
    remainingDuration = totalDuration;
  }

  var minutes = Math.floor(remainingDuration / 60);
  if (remainingDuration - minutes * 60 >= 30) {
    minutes++;
  }
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


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.handleSelectorElementHover_ =
    function(browserEvent) {

  browserEvent.preventDefault();
  var element = browserEvent.currentTarget;
  var index = parseInt(element.getAttribute('data-selector-index'), 10);

  this.hover_(index);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.handleSelectorElementUnhover_ =
    function(browserEvent) {

  browserEvent.preventDefault();

  this.unhover_();
};


/**
 * Hovers a route, displaying it temporarly on the map.
 * @param {number} index Index of the route to select
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.hover_ = function(index) {

  goog.events.dispatchEvent(this,
      ol.control.GoogleMapsDirectionsPanel.EventType.HOVER);
};


/**
 * Removes all temp routes on the map
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.unhover_ = function() {
  goog.events.dispatchEvent(this,
      ol.control.GoogleMapsDirectionsPanel.EventType.UNHOVER);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.handleSelectorElementPress_ =
    function(browserEvent) {

  browserEvent.preventDefault();
  var element = browserEvent.currentTarget;
  var index = parseInt(element.getAttribute('data-selector-index'), 10);

  this.select_(index);
};


/**
 * Selects the selector item
 * @param {number} index of the route
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.selectSelectorItem_ =
    function(index) {
  // Set the selected style to the element, and remove it from siblings
  var itemClass = this.classPrefix_ + '-selector-item';
  var selectedClass = this.classPrefix_ + '-selector-item-selected';
  var items = goog.dom.getElementsByClass(itemClass);
  if (items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      goog.dom.classes.remove(items.item(i), selectedClass);
      if (items.item(i).getAttribute('data-selector-index') == index)
        goog.dom.classes.add(items.item(i), selectedClass);
    }
  }

};


/**
 * Hide or display the suggested routes link.
 * @param {boolean} visible parameter. Omit if you wish to toggle.
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.selectorVisible_ =
    function(visible) {
  var element = document.getElementById(this.classPrefix_ + '-selector-toggle');
  if (typeof(visible) == 'undefined') {
    if (element.style.display == 'block')
      visible = false;
    else visible = true;
  }
  if (visible)
    element.style.display = 'block';
  else
    element.style.display = 'none';
};


/**
 * @private
 */
ol.control.GoogleMapsDirectionsPanel.prototype.handleToggleElementPress_ =
    function() {
  var element = document.getElementById(this.classPrefix_ + '-selector-toggle');
  var open = true;
  if (goog.dom.classes.has(element, this.classPrefix_ +
      '-selector-toggle-opened')) {
    goog.dom.classes.swap(element, this.classPrefix_ +
        '-selector-toggle-opened',
        this.classPrefix_ + '-selector-toggle-closed');
    open = false;
  }else {
    goog.dom.classes.swap(element, this.classPrefix_ +
        '-selector-toggle-closed',
        this.classPrefix_ + '-selector-toggle-opened');
  }
  this.selectorOpened_(open);
};


/**
 * @private
 * @param {boolean} open parameter. Call to open or close the selector panel.
 */
ol.control.GoogleMapsDirectionsPanel.prototype.selectorOpened_ =
    function(open) {
  var display = 'none';
  if (open) {
    display = 'block';
  }

  var itemClass = this.classPrefix_ + '-selector-item';
  var items = goog.dom.getElementsByClass(itemClass);
  if (items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      items.item(i).style.display = display;
    }
  }
};
