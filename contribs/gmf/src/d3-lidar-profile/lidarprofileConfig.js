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
     */
    this.pytreeLidarProfileJsonUrl = pytreeLidarProfileJsonUrl;

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
      server: null,
      loaded: false
    };
  }


  /**
   * Initialize the service variables from Pytree profile_config_gmf2 route
   * @return {angular.$q.Promise} configuration values
   * @export
   */
  initProfileConfig() {
    return this.$http_.get(`${this.pytreeLidarProfileJsonUrl}/profile_config_gmf2`).then((resp) => {

      this.profileConfig.server = /** @type {lidarProfileServer.Config} */ ({
        classification_colors: resp.data['classification_colors'] || null,
        debug: !!resp.data['debug'],
        default_attribute: resp.data['default_attribute'] || '',
        default_color: resp.data['default_color'] || '',
        default_point_attribute: resp.data['default_point_attribute'] || '',
        default_point_cloud: resp.data['default_point_cloud'] || '',
        initialLOD: resp.data['initialLOD'] || 0,
        max_levels: resp.data['max_levels'] || null,
        max_point_number: resp.data['max_point_number'] || 50000,
        minLOD: resp.data['minLOD'] || 0,
        point_attributes: resp.data['point_attributes'] || null,
        point_size: resp.data['point_size'] || 0,
        width: resp.data['width'] || 0
      });

      const attr = [];
      for (const key in this.profileConfig.server.point_attributes) {
        if (this.profileConfig.server.point_attributes[key].visible == 1) {
          attr.push(this.profileConfig.server.point_attributes[key]);
        }
      }

      const selectedMat = this.profileConfig.server.point_attributes[this.profileConfig.server.default_point_attribute];

      this.profileConfig.client.pointAttributes = {
        availableOptions: attr,
        selectedOption: selectedMat
      };
    });
  }
};

gmf.module.service('gmfLidarProfileConfig', gmf.lidarProfile.Config);
