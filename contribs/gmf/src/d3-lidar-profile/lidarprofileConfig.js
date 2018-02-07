goog.provide('gmf.lidarProfile.Config');

goog.require('gmf');


gmf.lidarProfile.Config = class {

  /**
   * Configuration service to configure the gmf.lidarPanelComponent and gmf.lidarProfile instance
   * Requires a Pytree service: https://github.com/sitn/pytree
   *
   * @struct
   * @param {angular.$http} $http Angular http service.
   * @param {string} pytreeLidarProfileJsonUrl pytree Lidar profile URL.
   * @ngInject
   * @ngdoc service
   * @ngname gmfLidarProfileConfig
   */
  constructor($http, pytreeLidarProfileJsonUrl) {

    /**
     * @type {angular.$http}
     * @private
     */
    this.$http_ = $http;

    /**
     * @type {string}
     * @private
     */
    this.pytreeLidarProfileJsonUrl_ = pytreeLidarProfileJsonUrl;

    /**
     * @type {gmfx.LidarProfileClientConfig}
     */
    const clientConfig = {
      autoWidth: true,
      margin: {
        'left': 40,
        'top': 10,
        'right': 200,
        'bottom': 40
      },
      pointAttributes: {},
      pointSum: 0,
      tolerance: 5
    };

    /**
     * @type {gmfx.LidarProfileConfig}
     */
    this.profileConfig = {
      client: clientConfig,
      server: {},
      loaded: false
    };
  }


  /**
   * Initialize the service variables from Pytree profile_config_gmf2 route
   * @return {angular.$http.HttpPromise} configuration values
   * @export
   */
  initProfileConfig() {
    return this.$http_.get(`${this.pytreeLidarProfileJsonUrl_}/profile_config_gmf2`).then((resp) => {

      const config = {};
      config.classification_colors = resp.data['classification_colors'];
      config.width = resp.data['width'];
      config.minLOD = resp.data['minLOD'];
      config.initialLOD = resp.data['initialLOD'];
      config.point_size = resp.data['point_size'];
      config.max_levels = resp.data['max_levels'];
      config.max_points_number = resp.data['max_point_number'];
      config.default_attribute = resp.data['default_attribute'];
      config.default_point_cloud = resp.data['default_point_cloud'];
      config.default_color = resp.data['default_color'];
      config.pointclouds = resp.data['pointclouds'];
      config.point_attributes = resp.data['point_attributes'];
      config.default_point_attribute = resp.data['default_point_attribute'];
      config.debug = resp.data['debug'];
      this.profileConfig.server = /** @type {lidarProfileServer.Config} */ (config);

      const attr = [];
      for (const key in config.point_attributes) {
        if (config.point_attributes[key].visible == 1) {
          attr.push(config.point_attributes[key]);
        }
      }

      const selectedMat = config.point_attributes[config.default_point_attribute];

      this.profileConfig.client.pointAttributes = {
        availableOptions: attr,
        selectedOption: selectedMat
      };
    });
  }
};

gmf.module.service('gmfLidarProfileConfig', gmf.lidarProfile.Config);
