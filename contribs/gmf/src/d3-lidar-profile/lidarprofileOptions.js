goog.provide('gmf.lidarProfile.options');
goog.require('gmf.lidarProfile');

/**
* @type {Object}
* @export
*/
gmf.lidarProfile.options = {};

/**
* @param {Object} options all lidar profile related options
* @export
*/
gmf.lidarProfile.options.setOptions = function(options) {
  gmf.lidarProfile.options = options;
};
