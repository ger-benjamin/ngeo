goog.provide('gmf.lidarProfile.Loader');

goog.require('gmf.lidarProfile.Utils');


gmf.lidarProfile.Loader = class {

  /**
   * FIXME desc
   * @struct
   * @param {gmf.lidarProfile.Manager} gmfLidarProfileManagerInstance gmf lidar profile manager instance
   */
  constructor(gmfLidarProfileManagerInstance) {

    /**
     * @type {gmf.lidarProfile.Manager}
     * @private
     */
    this.manager_ = gmfLidarProfileManagerInstance;

    /**
     * The hovered point attributes in d3 profile highlighted on the 2D map
     * @type {ol.Overlay}
     * @export
     */
    this.cartoHighlight = new ol.Overlay({
      offset: [0, -15],
      positioning: 'bottom-center'
    });

    /**
     * The hovered point geometry (point) in d3 profile highlighted on the 2D map
     * @type {ol.layer.Vector}
     * @export
     */
    this.lidarPointHighlight = new ol.layer.Vector({
      source: new ol.source.Vector({}),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 1)'
          }),
          radius: 3
        })
      })
    });

    /**
     * The profile footpring represented as a LineString represented
     * with real mapunites stroke width
     * @type {ol.layer.Vector}
     * @export
     */
    this.lidarBuffer = new ol.layer.Vector({
      source: new ol.source.Vector({})
    });


    /**
     * The variable where all points of the profile are stored
     * @type {gmfx.LidarProfilePoints}
     * @export
     */
    this.profilePoints = {
      distance: [],
      altitude: [],
      color_packed: [],
      intensity: [],
      classification: [],
      coords: []
    };

    /**
     * @type {string}
     * @private
     */
    this.lastUuid_;

    /**
     * @type {boolean}
     * @private
     */
    this.isPlotSetup_ = false;

    /**
     * @type {ol.geom.LineString}
     * @private
     */
    this.line;

    /**
     * @type {gmf.lidarProfile.Utils}
     */
    this.utils = new gmf.lidarProfile.Utils(this.manager_.options, this.profilePoints);
  }


  /**
   * Clears the profile footprint
   * @export
   */
  clearBuffer() {
    if (this.lidarBuffer) {
      this.lidarBuffer.getSource().clear();
    }
  }


  /**
  * Set the line for the profile
  * @export
  * @param {ol.geom.LineString} line that defines the profile
  */
  setLine(line) {
    this.line = line;
  }

  /**
  * Set the map for the ol.layer.Vector layers
  * @export
  * @param {ol.Map} map of the desktop app
  */
  setMap(map) {
    this.cartoHighlight.setMap(map);
    this.lidarPointHighlight.setMap(map);
    this.lidarBuffer.setMap(map);
    this.utils.setMap(map);
  }


  /**
  * Load profile data (lidar points) by succesive Levels Of Details using asynchronous requests
  * @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
  * @param {boolean} resetPlot wether to reset d3 plot or not
  * @param {number} minLOD minimum level of detail
  * @export
  */
  getProfileByLOD(distanceOffset, resetPlot, minLOD) {
    // FIXME
    this.profilePoints = {
      distance: [],
      altitude: [],
      color_packed: [],
      intensity: [],
      classification: [],
      coords: []
    };

    if (resetPlot) {
      this.isPlotSetup_ = false;
    }

    d3.select('#lidarError').style('visibility', 'hidden');
    this.manager_.options.pytreeLinestring = this.utils.getPytreeLinestring(this.line);

    let profileLine;
    let maxLODWith;
    if (distanceOffset == 0) {
      profileLine = this.manager_.options.pytreeLinestring;
      maxLODWith = this.utils.getNiceLOD(this.line.getLength());
    } else {
      const domain = this.manager_.plot.scaleX['domain']();
      const clip = this.utils.clipLineByMeasure(this.line, domain[0], domain[1]);
      profileLine = '';
      for (let i = 0; i < clip.clippedLine.length; i++) {
        profileLine += `{${clip.clippedLine[i][0]},${clip.clippedLine[i][1]}},`;
      }
      profileLine = profileLine.substr(0, profileLine.length - 1);
      maxLODWith = this.utils.getNiceLOD(domain[1] - domain[0]);

    }

    const uuid = this.utils.UUID();
    this.lastUuid_ = uuid;
    let lastLOD = false;

    d3.select('#lodInfo').html('');
    this.manager_.options.profileConfig.pointSum = 0;
    let profileWidth = 0;
    if (this.manager_.options.profileConfig.autoWidth) {
      profileWidth = maxLODWith.width;
    } else {
      profileWidth = this.manager_.options.profileConfig.profilWidth;
    }

    d3.select('#widthInfo').html(`Profile width: ${profileWidth}m`);

    for (let i = 0; i < maxLODWith.maxLOD; i++) {
      if (i == 0) {
        this.queryPytree_(this.manager_.options, minLOD, this.manager_.options.profileConfig.initialLOD, i, profileLine, distanceOffset, lastLOD, profileWidth, resetPlot, uuid);
        i += this.manager_.options.profileConfig.initialLOD - 1;
      } else if (i < maxLODWith.maxLOD - 1) {
        this.queryPytree_(this.manager_.options, minLOD + i, minLOD + i + 1, i, profileLine, distanceOffset, lastLOD, profileWidth, false, uuid);
      } else {
        lastLOD = true;
        this.queryPytree_(this.manager_.options, minLOD + i, minLOD + i + 1, i, profileLine, distanceOffset, lastLOD, profileWidth, false, uuid);
      }
    }
  }


  /**
   * Request to Pytree service for a range of Level Of Detail (LOD)
   * @param {Object} options the profile Options
   * @param {number} minLOD minimum level of detail of the request
   * @param {number} maxLOD maximum level of detail of the request
   * @param {number} iter the iteration in profile requests cycle
   * @param {string} coordinates linestring in cPotree format
   * @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
   * @param {boolean} lastLOD the deepest level to retrieve for this profile
   * @param {number} width the width of the profile
   * @param {boolean} resetPlot wether to reset d3 plot or not, used for first LOD
   * @param {string} uuid the unique identifier of the current profile requests cycle
   * @private
   */
  queryPytree_(options, minLOD, maxLOD, iter, coordinates, distanceOffset, lastLOD, width, resetPlot, uuid) {
    if (this.manager_.options.profileConfig.debug) {
      let html = d3.select('#lodInfo').html();
      html += `Loading LOD: ${minLOD}-${maxLOD}...<br>`;
      d3.select('#lodInfo').html(html);
    }

    const pointCloudName = this.manager_.options.profileConfig.defaultPointCloud;
    const hurl = `${options.pytreeLidarProfileJsonUrl_}/get_profile?minLOD=${minLOD}
      &maxLOD=${maxLOD}&width=${width}&coordinates=${coordinates}&pointCloud=${pointCloudName}&attributes='`;

    this.manager_.$http.get(hurl, {
      headers: {
        'Content-Type': 'text/plain; charset=x-user-defined'
      },
      responseType: 'arraybuffer'
    }).then((response) => {
      if (this.manager_.options.profileConfig.debug) {
        let html = d3.select('#lodInfo').html();
        html += `LOD: ${minLOD}-${maxLOD} loaded <br>`;
        d3.select('#lodInfo').html(html);
      }
      this.processBuffer_(response.data, iter, distanceOffset, lastLOD, resetPlot);
    }, (response) => {
      console.log(response);
    });
  }


  /**
   * Process the binary array return by Pytree (cPotree)
   * @param {ArrayBuffer} profile binary array returned by cPotree executable called by Pytree
   * @param {number} iter the iteration in profile requests cycle
   * @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
   * @param {boolean} lastLOD the deepest level to retrieve for this profile
   * @param {boolean} resetPlot wether to reset d3 plot or not
   * @private
   */
  processBuffer_(profile, iter, distanceOffset, lastLOD, resetPlot) {
    const typedArrayInt32 = new Int32Array(profile, 0, 4);
    const headerSize = typedArrayInt32[0];

    const uInt8header = new Uint8Array(profile, 4, headerSize);
    let strHeaderLocal = '';
    for (let i = 0; i < uInt8header.length; i++) {
      strHeaderLocal += String.fromCharCode(uInt8header[i]);
    }

    try {

      JSON.parse(strHeaderLocal);

    } catch (e) {
      if (!this.isPlotSetup_) {
        const canvasEl = d3.select('#profileCanvas').node();
        const ctx = d3.select('#profileCanvas')
          .node().getContext('2d');
        ctx.clearRect(0, 0, canvasEl.getBoundingClientRect().width, canvasEl.getBoundingClientRect().height);
        d3.select('svg#profileSVG').selectAll('*').remove();
        let errorTxt = '<p><b>Lidar profile service error</b></p>';
        errorTxt += '<p>It might be offline</p>';
        // TODO: check extent consistency earlier
        errorTxt += '<p>Or did you attempt to draw a profile outside data extent ?</p>';
        errorTxt += '<p>Or did you attempt to draw such a small profile that no point was returned ?</p>';
        d3.select('#lidarError').style('visibility', 'visible');
        d3.select('#lidarError').html(errorTxt);
      }
      return;
    }

    d3.select('#lidarError').style('visibility', 'hidden');

    const jHeader = JSON.parse(strHeaderLocal);

    // If number of points return is higher than Pytree configuration max value,
    // stop sending requests.
    this.manager_.options.profileConfig.pointSum += jHeader['points'];
    if (this.manager_.options.profileConfig.pointSum > this.manager_.options.profileConfig.maxPoints) {
      this.abortPendingRequests();
    }

    const attr = jHeader['pointAttributes'];
    const attributes = [];
    for (let j = 0; j < attr.length; j++) {
      if (this.manager_.options.profileConfig.pointAttributesRaw [attr[j]] != undefined) {
        attributes.push(this.manager_.options.profileConfig.pointAttributesRaw[attr[j]]);
      }
    }
    const scale = jHeader['scale'];

    if (jHeader['points'] < 3) {
      this.isPlotSetup_ = false;
      return;
    }

    /**
    * @type {gmfx.LidarProfilePoints}
    */
    const points = {
      distance: [],
      altitude: [],
      color_packed: [],
      intensity: [],
      classification: [],
      coords: []
    };

    const bytesPerPoint = jHeader['bytesPerPoint'];
    const buffer = profile.slice(4 + headerSize);
    for (let i = 0; i < jHeader['points']; i++) {

      const byteOffset = bytesPerPoint * i;
      const view = new DataView(buffer, byteOffset, bytesPerPoint);
      let aoffset = 0;
      for (let k = 0; k < attributes.length; k++) {

        if (attributes[k]['value'] == 'POSITION_PROJECTED_PROFILE') {

          const udist = view.getUint32(aoffset, true);
          const ualti = view.getUint32(aoffset + 4, true);
          const dist = udist * scale;
          const alti = ualti * scale;
          points.distance.push(Math.round(100 * (distanceOffset + dist)) / 100);
          this.profilePoints.distance.push(Math.round(100 * (distanceOffset + dist)) / 100);
          points.altitude.push(Math.round(100 * alti) / 100);
          this.profilePoints.altitude.push(Math.round(100 * alti) / 100);

        } else if (attributes[k]['value']  == 'CLASSIFICATION') {
          const classif = view.getUint8(aoffset);
          points.classification.push(classif);
          this.profilePoints.classification.push(classif);

        } else if (attributes[k]['value']  == 'INTENSITY') {
          const intensity = view.getUint8(aoffset);
          points.intensity.push(intensity);
          this.profilePoints.intensity.push(intensity);

        } else if (attributes[k]['value'] == 'COLOR_PACKED') {
          const r = view.getUint8(aoffset);
          const g = view.getUint8(aoffset + 1);
          const b = view.getUint8(aoffset + 2);
          points.color_packed.push([r, g, b]);
          this.profilePoints.color_packed.push([r, g, b]);

        } else if (attributes[k]['value']  == 'POSITION_CARTESIAN') {
          const x = view.getInt32(aoffset, true) * scale + jHeader['boundingBox']['lx'];
          const y = view.getInt32(aoffset + 4, true) * scale + jHeader['boundingBox']['ly'];
          points.coords.push([x, y]);
          this.profilePoints.coords.push([x, y]);
        }
        aoffset = aoffset + attributes[k]['bytes'];
      }
    }

    const rangeX = [0, this.line.getLength()];

    // TODO fix z offset issue in Pytree!

    const rangeY = [this.utils.arrayMin(points.altitude), this.utils.arrayMax(points.altitude)];

    if (iter == 0 && resetPlot) {
      this.manager_.plot.setupPlot(rangeX, rangeY);
      this.isPlotSetup_ = true;
      this.manager_.plot.drawPoints(points, this.manager_.options.profileConfig.defaultAttribute);

    } else if (!this.isPlotSetup_) {
      this.manager_.plot.setupPlot(rangeX, rangeY);
      this.isPlotSetup_ = true;
      this.manager_.plot.drawPoints(points, this.manager_.options.profileConfig.defaultAttribute);
    } else {
      this.manager_.plot.drawPoints(points, this.manager_.options.profileConfig.defaultAttribute);
    }
  }


  /**
   * Update the profile data according to d3 chart zoom and pan level
   * @export
   */
  updateData() {
    const domainX = this.manager_.plot.scaleX['domain']();
    const domainY = this.manager_.plot.scaleY['domain']();
    const clip = this.utils.clipLineByMeasure(this.line, domainX[0], domainX[1]);

    this.lidarBuffer.getSource().clear();
    this.lidarBuffer.getSource().addFeature(clip.bufferGeom);
    this.lidarBuffer.setStyle(clip.bufferStyle);

    const span = domainX[1] - domainX[0];
    const maxLODWidth = this.utils.getNiceLOD(span);
    const xTolerance = 0.2;

    if (Math.abs(domainX[0] - this.manager_.plot.previousDomainX[0]) < xTolerance &&
        Math.abs(domainX[1] - this.manager_.plot.previousDomainX[1]) < xTolerance) {

      this.manager_.plot.drawPoints(this.profilePoints,
        this.manager_.options.profileConfig.defaultAttribute);

    } else {
      if (maxLODWidth.maxLOD <= this.manager_.options.profileConfig.initialLOD) {
        this.manager_.plot.drawPoints(this.profilePoints,
          this.manager_.options.profileConfig.defaultAttribute);
      } else {
        this.getProfileByLOD(clip.distanceOffset, false, 0);

      }
    }

    this.manager_.plot.previousDomainX = domainX;
    this.manager_.plot.previousDomainY = domainY;
  }


  /**
   * FIXME
   * Abort pending request to Pytree service when new batch of request is sent
   * after zoom, pan or when new profile is drawn
   * @export
   */
  abortPendingRequests() {
    console.log('Not implemented yet');
  }
};
