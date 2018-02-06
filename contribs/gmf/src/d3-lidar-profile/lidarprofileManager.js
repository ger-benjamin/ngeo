goog.provide('gmf.lidarProfileManager');


gmf.lidarProfileManager = class {

 /**
  * Provides a service to manage a D3js component to be used to draw an lidar point cloud profile chart.
  * Requires access to a Pytree webservice: https://github.com/sitn/pytree
  *
  * @struct
  * @constructor
  * @param {angular.$http} $http Angular http service.
  * @ngInject
  * @ngdoc service
  * @ngname gmfDataSourcesManager
  */   
  constructor($http) {

    /**
     * @type {angular.$http}
     * @private
     */
    this.$http_ = $http;

    /**
     * @type {gmf.lidarProfile.plot}
     */
    this.plot = null;
  
    /**
     * @type {gmf.lidarProfile.loader}
     */
    this.loader = null;
  
    /**
     * @type {gmf.lidarProfile.measure}
     */
    this.measure = null;
  };

  /**
   * @param {Object} options from pytree
   */
  init(options) {
    this.plot = new gmf.lidarProfile.plot(options, this);
    this.loader = new gmf.lidarProfile.loader(options, this.plot);
    this.measure = new gmf.lidarProfile.measure(options, this);
  };
};

gmf.module.service('gmfLidarProfileManager', gmf.lidarProfileManager);
