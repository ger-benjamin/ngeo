goog.provide('gmf.lidarProfile.Manager');

goog.require('gmf.lidarProfile.Loader')
goog.require('gmf.lidarProfile.Measure');
goog.require('gmf.lidarProfile.Plot');


gmf.lidarProfile.Manager = class {

  /**
   * FIXME sitn mentions
   * FIXME Object types
   * FIXME private
   * FIXME .bind(this)
   * FIXME console.log
   * Provides a service to manage a D3js component to be used to draw an lidar point cloud profile chart.
   * Requires access to a Pytree webservice: https://github.com/sitn/pytree
   *
   * @struct
   * @param {angular.$http} $http Angular http service.
   * @ngInject
   * @ngdoc service
   * @ngname gmflidarProfileManager
   */
  constructor($http) {

    /**
     * @type {angular.$http}
     */
    this.$http = $http;

    /**
     * @type {?angular.$q.Promise}
     * @private
     */
    this.promise = null;

    /**
     * @type {gmf.lidarProfile.Plot}
     */
    this.plot = null;

    /**
     * @type {gmf.lidarProfile.Loader}
     */
    this.loader = null;

    /**
     * @type {gmf.lidarProfile.Measure}
     */
    this.measure = null;

    /**
     * @type {Object}
     * @export
     */
    this.options = null;
  }

  /**
   * @param {Object} options from pytree
   */
  init(options) {
    this.options = options;
    this.plot = new gmf.lidarProfile.Plot(this);
    this.loader = new gmf.lidarProfile.Loader(this);
    this.measure = new gmf.lidarProfile.Measure(this);
  }
};

gmf.module.service('gmfLidarProfileManager', gmf.lidarProfile.Manager);
