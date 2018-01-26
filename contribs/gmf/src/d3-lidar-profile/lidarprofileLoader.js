goog.provide('gmf.lidarProfile.loader');


/**
* @constructor
* @param {Object} options to be defined in gmfx
* @param {Object} plot to be defined in gmfx
*/
gmf.lidarProfile.loader = function(options, plot) {

  this.options = options;

  this.plot = plot;

  this.utils = new gmf.lidarProfile.utils(options);

  /**
  * @type {ol.Overlay}
  * @export
  */
  this.cartoHighlight = new ol.Overlay({
    offset: [0, -15],
    positioning: 'bottom-center'
  });

  /**
  * @type {ol.layer.Vector}
  * @export
  */
  this.lidarPointHighlight = new ol.layer.Vector({
    source: new ol.source.Vector({
    }),
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
  * @type {ol.layer.Vector}
  * @export
  */
  this.lidarBuffer = new ol.layer.Vector({});


  /**
  * @type {Array}
  */
  this.requestsQueue = [];

  /**
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
  * @export
  */
  this.clearBuffer = function() {
    if (this.lidarBuffer) {
      this.lidarBuffer.setSource(null);
    }
  };

  /**
  * @type {string}
  */
  this.lastUuid;

  this.cartoHighlight.setMap(this.options.map);
  this.lidarPointHighlight.setMap(this.options.map);
  this.lidarBuffer.setMap(this.options.map);

};


/**
* @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
* @param {boolean} resetPlot wether to reset d3 plot or not
* @param {number} minLOD minimum level of detail
* @export
*/
gmf.lidarProfile.loader.prototype.getProfileByLOD = function(distanceOffset, resetPlot, minLOD) {

  this.clearBuffer();

  this.options.pytreeLinestring =  this.utils.getPytreeLinestring(this.options.olLinestring);

  let profileLine;
  let maxLODWith;
  if (distanceOffset == 0) {
    profileLine = this.options.pytreeLinestring;
    maxLODWith = this.utils.getNiceLOD(this.options.olLinestring.getLength());
  } else {

    const domain = this.options.profileConfig.scaleX.domain();
    const clip = this.utils.clipLineByMeasure(this.options.olLinestring, domain[0], domain[1]);
    profileLine = '';
    for (let i = 0; i < clip.clippedLine.length; i++) {
      profileLine += `{${clip.clippedLine[i][0]},${clip.clippedLine[i][1]}},`;
    }
    profileLine = profileLine.substr(0, profileLine.length - 1);
    maxLODWith = this.utils.getNiceLOD(domain[1] - domain[0]);

    this.lidarBuffer.setSource(null);
    this.lidarBuffer.setSource(clip.vectorSource);
    this.lidarBuffer.setStyle(clip.styles);
  }

  const uuid = this.utils.UUID();
  this.lastUuid = uuid;
  let lastLOD = false;

  d3.select('#lodInfo').html('');
  this.options.profileConfig.pointSum = 0;
  let profileWidth = 0;
  if (this.options.profileConfig.autoWidth) {
    profileWidth = maxLODWith.width;
  } else {
    profileWidth = this.options.profileConfig.profilWidth;
  }

  d3.select('#widthInfo').html(`Profile width: ${profileWidth}m`);

  for (let i = 0; i < maxLODWith.maxLOD; i++) {
    if (i == 0) {
      this.xhrRequest(this.options, minLOD, this.options.profileConfig.initialLOD, i, profileLine, distanceOffset, lastLOD, profileWidth, resetPlot, uuid);
      i += this.options.profileConfig.initialLOD - 1;
    } else if (i < maxLODWith.maxLOD - 1) {
      this.xhrRequest(this.options, minLOD + i, minLOD + i + 1, i, profileLine, distanceOffset, lastLOD, profileWidth, false, uuid);
    } else {
      lastLOD = true;
      this.xhrRequest(this.options, minLOD + i, minLOD + i + 1, i, profileLine, distanceOffset, lastLOD, profileWidth, false, uuid);
    }
  }

};

/**
* @param {Object} options the profile Options
* @param {number} minLOD minimum level of detail
* @param {number} maxLOD maximum level of detail
* @param {number} iter the iteration in profile requests cycle
* @param {string} coordinates linestring in cPotree format
* @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
* @param {boolean} lastLOD the deepest level to retrieve for this profile
* @param {number} width the width of the profile
* @param {boolean} resetPlot weather to reset d3 plot or not
* @param {string} uuid the unique identifier the current profile requests cycle
* @private
*/
gmf.lidarProfile.loader.prototype.xhrRequest = function(options, minLOD, maxLOD, iter, coordinates, distanceOffset, lastLOD, width, resetPlot, uuid) {

  if (this.options.profileConfig.debug) {
    let html = d3.select('#lodInfo').html();
    html += `Loading LOD: ${minLOD}-${maxLOD}...<br>`;
    d3.select('#lodInfo').html(html);
  }
  const pointCloudName = this.options.profileConfig.defaultPointCloud;
  const hurl = `${options.pytreeLidarProfileJsonUrl_}/get_profile?minLOD=${minLOD}
    &maxLOD=${maxLOD}&width=${width}&coordinates=${coordinates}&pointCloud=${pointCloudName}&attributes='`;

  for (let i = 0; i < this.requestsQueue.length; i++) {
    if (this.requestsQueue[i].uuid != this.lastUuid) {
      this.requestsQueue[i].abort();
      this.requestsQueue.splice(i, 1);
    }
  }

  const that = this;
  const xhr = new XMLHttpRequest();
  xhr.uuid = uuid;
  xhr.lastUuid = this.lastUuid;
  xhr.debug = this.options.profileConfig.debug;
  xhr.open('GET', hurl, true);
  xhr.responseType = 'arraybuffer';
  xhr.overrideMimeType('text/plain; charset=x-user-defined');
  xhr.onreadystatechange = function() {

    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (this.uuid == this.lastUuid) {
          if (xhr.debug) {
            let html = d3.select('#lodInfo').html();
            html += `LOD: ${minLOD}-${maxLOD} loaded <br>`;
            d3.select('#lodInfo').html(html);
          }
          const xhrresponse = /** @type {!ArrayBuffer}*/(xhr.response);
          that.processBuffer(xhrresponse, iter, distanceOffset, lastLOD, resetPlot);
        }
      }
    }
  };

  try {
    this.requestsQueue.push(xhr);
    xhr.send(null);
  } catch (e) {
    console.log(e);
  }
};

/**
* @param {ArrayBuffer} profile binary array returned by cPotree executable called by Pytree
* @param {number} iter the iteration in profile requests cycle
* @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
* @param {boolean} lastLOD the deepest level to retrieve for this profile
* @param {boolean} resetPlot wether to reset d3 plot or not
* @private
*/
gmf.lidarProfile.loader.prototype.processBuffer = function(profile, iter, distanceOffset, lastLOD, resetPlot) {
  console.log('process buffer');
  try {

    const typedArrayInt32 = new Int32Array(profile, 0, 4);
    const headerSize = typedArrayInt32[0];

    const uInt8header = new Uint8Array(profile, 4, headerSize);
    let strHeaderLocal = '';
    for (let i = 0; i < uInt8header.length; i++) {
      strHeaderLocal += String.fromCharCode(uInt8header[i]);
    }

    const jHeader = JSON.parse(strHeaderLocal);
    this.options.profileConfig.pointSum += jHeader['points'];
    if (this.options.profileConfig.pointSum > this.options.profileConfig.maxPoints) {
      this.abortPendingRequests();
    }

    const attr = jHeader['pointAttributes'];
    const attributes = [];
    for (let j = 0; j < attr.length; j++) {
      if (this.options.profileConfig.pointAttributesRaw [attr[j]] != undefined) {
        attributes.push(this.options.profileConfig.pointAttributesRaw[attr[j]]);
      }
    }
    const scale = jHeader['scale'];

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

    const rangeX = [0, this.options.olLinestring.getLength()];
    // let rangeY = [gmf.lidarProfile.loader.arrayMin(points.altitude), gmf.lidarProfile.loader.arrayMax(points.altitude)];
    let rangeY = [jHeader['boundingBox']['lz'], jHeader['boundingBox']['uz']];

    // TODO fix z offset issue in cPotree here is an hugly fix:
    // for (let b = 0; b < points.altitude.length; b++) {
    //   points.altitude[b] = points.altitude[b] - rangeY[0] + jHeader.boundingBox.lz;
    //   gmf.lidarProfile.loader.profilePoints.altitude[b] = gmf.lidarProfile.loader.profilePoints.altitude[b] - rangeY[0] + jHeader.boundingBox.lz;
    // }

    rangeY = [this.utils.arrayMin(points.altitude), this.utils.arrayMax(points.altitude)];

    if (iter == 0 && resetPlot) {
      console.log('hihihi');
      console.log(this);
      this.plot.setupPlot(rangeX, rangeY);
      this.plot.drawPoints(points, this.options.profileConfig.defaultAttribute);

    } else {
      this.plot.drawPoints(points, this.options.profileConfig.defaultAttribute);
    }

  } catch (e) {
    console.log(e);
  }
};

/**
* @export
*/
gmf.lidarProfile.loader.prototype.updateData = function() {
  const scaleX = this.options.profileConfig.scaleX;
  const scaleY = this.options.profileConfig.scaleY;
  const domainX = scaleX.domain();
  const domainY = scaleY.domain();

  const clip = this.utils.clipLineByMeasure(this.options.olLinestring, domainX[0], domainX[1]);
  this.lidarBuffer.setSource(null);
  this.lidarBuffer.setSource(clip.vectorSource);
  this.lidarBuffer.setStyle(clip.styles);
  const span = domainX[1] - domainX[0];
  const maxLODWidth = this.utils.getNiceLOD(span);
  const xTolerance = 0.2;

  if (Math.abs(domainX[0] - this.options.profileConfig.previousDomainX[0]) < xTolerance &&
      Math.abs(domainX[1] - this.options.profileConfig.previousDomainX[1]) < xTolerance) {

    this.plot.drawPoints(this.profilePoints,
      this.options.profileConfig.defaultAttribute);
  } else {
    if (maxLODWidth.maxLOD <= this.options.profileConfig.initialLOD) {
      this.plot.drawPoints(this.profilePoints,
        this.options.profileConfig.defaultAttribute);
    } else {
      this.getProfileByLOD(clip.distanceOffset, false, 0);

    }
  }

  this.options.profileConfig.previousDomainX = domainX;
  this.options.profileConfig.previousDomainY = domainY;

};


/**
* @export
*/
gmf.lidarProfile.loader.prototype.abortPendingRequests = function() {

  for (let i = 0; i < this.requestsQueue.length; i++) {
    this.requestsQueue[i].abort();
    this.requestsQueue.splice(i, 1);
  }
};
