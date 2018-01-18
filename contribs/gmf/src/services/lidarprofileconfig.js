goog.provide('gmf.LidarProfileConfig');

goog.require('gmf');


/**
 * @constructor
 * @struct
 * @param {angular.$http} $http Angular http service.
 * @param {string} pytreeLidarProfileJsonUrl pytree Lidar profile URL.
 * @ngInject
 * @ngdoc service
 * @ngname gmfLidarProfileConfig
 */
gmf.LidarProfileConfig = function($http, pytreeLidarProfileJsonUrl) {
  /**
   * @type {angular.$http}
   * @private
   */
  this.$http_ = $http;
  /**
   * @type {ol.geom.LineString}
   */
  this.olLinestring = null;
  /**
   * @type {ol.Map}
   */
  this.map = null;
  /**
   * @type {string}
   */
  this.pytreeLidarProfileJsonUrl_ = pytreeLidarProfileJsonUrl;
  /**
   * @type {Object}
   */
  this.profileConfig = {};
  /**
   * @type {Object}
   */
  this.profileConfig.scaleX = {};
  /**
   * @type {Object}
   */
  this.profileConfig.currentScaleY = {};
  /**
   * @type {Array.<number>}
   */
  this.profileConfig.previousDomainX = [];
  /**
   * @type {Array.<number>}
   */
  this.profileConfig.previousDomainY = [];
  /**
   * @type {number}
   */
  this.profileConfig.currentZoom = 1;
  /**
   * @type {number}
   */
  this.profileConfig.distanceOffset = 0;
  /**
   * @type {{left: number, top: number, right: number, bottom: number}}
   */
  this.profileConfig.margin = {
    'left': 40,
    'top': 10,
    'right': 200,
    'bottom': 40
  };
  /**
   * @type {number}
   */
  this.profileConfig.tolerance = 5;
  /**
   * @type {boolean}
   */
  this.profileConfig.configLoaded = false;

};

/**
* @export
* @return {Object} configuration values
*/
gmf.LidarProfileConfig.prototype.initProfileConfig = function() {
  return this.$http_.get(`${this.pytreeLidarProfileJsonUrl_}/profile_config_gmf2`).then((resp) => {

    this.profileConfig.classification = resp.data['classification_colors'];
    this.profileConfig.profilWidth = resp.data['width'];
    this.profileConfig.autoWidth = true;
    this.profileConfig.minLOD = resp.data['minLOD'];
    this.profileConfig.initialLOD = resp.data['initialLOD'];
    this.profileConfig.pointSize = resp.data['point_size'];
    this.profileConfig.pointAttributes = resp.data['point_attributes'];
    this.profileConfig.defaultPointAttribute = resp.data['default_point_attribute'];
    this.profileConfig.maxLevels = resp.data['max_levels'];
    this.profileConfig.maxPoints = resp.data['max_point_number'];
    this.profileConfig.pointSum = 0;
    this.profileConfig.defaultAttribute = resp.data['default_attribute'];
    this.profileConfig.defaultPointCloud = resp.data['default_point_cloud'];
    this.profileConfig.defaultColor = resp.data['default_color'];
    this.profileConfig.pointClouds = resp.data['pointclouds'];

  });
};

gmf.module.service('gmfLidarProfileConfig', gmf.LidarProfileConfig);
