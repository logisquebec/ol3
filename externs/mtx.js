/**
 * @type {Object}
 */
var mtx;


/**
 * @typedef {{description: (number),
 *     id: (number),
 *     lat: (number),
 *     lon: (number),
 *     text: (string)}}
 */
mtx.format.Address;


/**
 * @type {string}
 */
mtx.format.Address.prototype.description;


/**
 * @type {number}
 */
mtx.format.Address.prototype.id;


/**
 * @type {number}
 */
mtx.format.Address.prototype.lat;


/**
 * @type {number}
 */
mtx.format.Address.prototype.lon;


/**
 * @type {string}
 */
mtx.format.Address.prototype.text;


/**
 * @type {Array.<number>}
 */
google.maps.DirectionsLeg.prototype.end_coordinate;


/**
 * @type {Array.<number>}
 */
google.maps.DirectionsLeg.prototype.start_coordinate;


/**
 * @type {string}
 */
google.maps.DirectionsStep.prototype.maneuver;


/**
 * @type {string}
 */
google.maps.DirectionsRoute.prototype.summary;


/**
 * @type {Object}
 */
google.maps.DirectionsRoute.prototype.mt_usager;


/**
 * @type {string}
 */
google.maps.mt_usager.prototype.mt_last_name;


/**
 * @type {string}
 */
google.maps.mt_usager.prototype.mt_first_name;


/**
 * @type {string}
 */
google.maps.mt_usager.prototype.mt_email;

/**
 * @type {string}
 */
google.maps.mt_usager.prototype.mt_anonymous;

/**
 * @type {string}
 */
google.maps.mt_usager.prototype.mt_photo;


/**
 * @type {number}
 */
google.maps.mt_usager.prototype.mt_evaluation;


/**
 * @type {number}
 */
google.maps.mt_usager.prototype.mt_group_approved;


/**
 * @type {string}
 */
google.maps.mt_usager.prototype.mt_group_name;


/**
 * @type {Object}
 */
google.maps.DirectionsRoute.prototype.mt_offre;


/**
 * @type {number}
 */
google.maps.mt_offre.prototype.mt_est_conducteur;


/**
 * @type {number}
 */
google.maps.mt_offre.prototype.mt_places_dispo;


/**
 * @type {number}
 */
google.maps.mt_offre.prototype.mt_fume;


/**
 * @type {number}
 */
google.maps.mt_offre.prototype.mt_atmosphere;


/**
 * @type {string}
 */
google.maps.mt_offre.prototype.mt_prix;


/**
 * @type {string}
 */
google.maps.mt_offre.prototype.mt_date;


/**
 * @type {string}
 */
google.maps.mt_offre.prototype.mt_heure;


/**
 * @type {number}
 */
google.maps.mt_offre.prototype.mt_horaire_ponctuelle;


/**
 * @type {Array.<string>}
 */
google.maps.DirectionsRoute.prototype.mt_org;


/**
 * @param {string|Object.<string,*>=} opt_option
 * @return {!jQuery}
 */
jQuery.prototype.disableSelection = function(opt_option) {};


/**
 * @param {string|Object.<string,*>=} opt_option
 * @return {!jQuery}
 */
jQuery.prototype.sortable = function(opt_option) {};