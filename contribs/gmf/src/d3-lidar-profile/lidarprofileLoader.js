goog.provide('gmf.lidarProfile.loader');

/**
* @constructor
*/
gmf.lidarProfile.loader = function() {};

/**
* @type {ol.Overlay}
* @export
*/
gmf.lidarProfile.loader.cartoHighlight = new ol.Overlay({
  offset: [0, -15],
  positioning: 'bottom-center'
});

/**
* @type {ol.layer.Vector}
* @export
*/
gmf.lidarProfile.loader.lidarPointHighlight = new ol.layer.Vector({
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
gmf.lidarProfile.loader.lidarBuffer = new ol.layer.Vector({});


/**
* @type {Array}
*/
gmf.lidarProfile.loader.requestsQueue = [];

/**
* @type {gmfx.LidarProfilePoint}
* @export
*/
gmf.lidarProfile.loader.profilePoints = {
  altitude: [],
  classification: [],
  color_packed: [],
  coords: [],
  distance: [],
  intensity: []
};

/**
* @export
*/
gmf.lidarProfile.loader.clearBuffer = function() {
  if (gmf.lidarProfile.loader.lidarBuffer) {
    gmf.lidarProfile.loader.lidarBuffer.setSource(null);
  }
};


/**
* @param {number} distanceOffset the left side of d3 profile domain at current zoom and pan configuration
* @param {boolean} resetPlot wether to reset d3 plot or not
* @param {number} minLOD minimum level of detail
* @export
*/
gmf.lidarProfile.loader.getProfileByLOD = function(distanceOffset, resetPlot, minLOD) {
  // TODO: setup this in a better way
  gmf.lidarProfile.loader.cartoHighlight.setMap(gmf.lidarProfile.options.map);
  gmf.lidarProfile.loader.lidarPointHighlight.setMap(gmf.lidarProfile.options.map);
  gmf.lidarProfile.loader.lidarBuffer.setMap(gmf.lidarProfile.options.map);


  gmf.lidarProfile.loader.clearBuffer();
  gmf.lidarProfile.options.pytreeLinestring =  gmf.lidarProfile.loader.getPytreeLinestring(gmf.lidarProfile.options.olLinestring);
  let profileLine;
  let maxLODWith;
  if (distanceOffset == 0) {
    profileLine = gmf.lidarProfile.options.pytreeLinestring;
    maxLODWith = gmf.lidarProfile.utils.getNiceLOD(gmf.lidarProfile.options.olLinestring.getLength());
  } else {

    const domain = gmf.lidarProfile.options.profileConfig.scaleX.domain();
    const clip = gmf.lidarProfile.utils.clipLineByMeasure(domain[0], domain[1]);
    profileLine = '';
    for (let i = 0; i < clip.clippedLine.length; i++) {
      profileLine += `{${clip.clippedLine[i][0]},${clip.clippedLine[i][1]}},`;
    }
    profileLine = profileLine.substr(0, profileLine.length - 1);
    maxLODWith = gmf.lidarProfile.utils.getNiceLOD(domain[1] - domain[0]);
  }

  const uuid = gmf.lidarProfile.loader.UUID();
  gmf.lidarProfile.loader.lastUuid = uuid;
  let lastLOD = false;

  d3.select('#lodInfo').html('');
  gmf.lidarProfile.options.profileConfig.pointSum = 0;
  let profileWidth = 0;
  if (gmf.lidarProfile.options.profileConfig.autoWidth) {
    profileWidth = maxLODWith.width;
  } else {
    profileWidth = gmf.lidarProfile.options.profileConfig.profilWidth;
  }

  d3.select('#widthInfo').html(`Profile width: ${profileWidth}m`);

  for (let i = 0; i < maxLODWith.maxLOD; i++) {
    if (i == 0) {
      gmf.lidarProfile.loader.xhrRequest(gmf.lidarProfile.options, minLOD, gmf.lidarProfile.options.profileConfig.initialLOD, i, profileLine, distanceOffset, lastLOD, profileWidth, resetPlot, uuid);
      i += gmf.lidarProfile.options.profileConfig.initialLOD - 1;
    } else if (i < maxLODWith.maxLOD - 1) {
      gmf.lidarProfile.loader.xhrRequest(gmf.lidarProfile.options, minLOD + i, minLOD + i + 1, i, profileLine, distanceOffset, lastLOD, profileWidth, false, uuid);
    } else {
      lastLOD = true;
      gmf.lidarProfile.loader.xhrRequest(gmf.lidarProfile.options, minLOD + i, minLOD + i + 1, i, profileLine, distanceOffset, lastLOD, profileWidth, false, uuid);
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
gmf.lidarProfile.loader.xhrRequest = function(options, minLOD, maxLOD, iter, coordinates, distanceOffset, lastLOD, width, resetPlot, uuid) {

  if (gmf.lidarProfile.options.profileConfig.debug) {
    let html = d3.select('#lodInfo').html();
    html += `Loading LOD: ${minLOD}-${maxLOD}...<br>`;
    d3.select('#lodInfo').html(html);
  }
  const pointCloudName = gmf.lidarProfile.options.profileConfig.defaultPointCloud;
  const hurl = `${options.pytreeLidarProfileJsonUrl_}/get_profile?minLOD=${minLOD}
    &maxLOD=${maxLOD}&width=${width}&coordinates=${coordinates}&pointCloud=${pointCloudName}&attributes='`;

  for (let i = 0; i < gmf.lidarProfile.loader.requestsQueue.length; i++) {
    if (gmf.lidarProfile.loader.requestsQueue[i].uuid != gmf.lidarProfile.loader.lastUuid) {
      gmf.lidarProfile.loader.requestsQueue[i].abort();
      gmf.lidarProfile.loader.requestsQueue.splice(i, 1);
    }
  }

  const xhr = new XMLHttpRequest();
  xhr.uuid = uuid;
  xhr.open('GET', hurl, true);
  xhr.responseType = 'arraybuffer';
  xhr.overrideMimeType('text/plain; charset=x-user-defined');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (this.uuid == gmf.lidarProfile.loader.lastUuid) {
          if (gmf.lidarProfile.options.profileConfig.debug) {
            let html = d3.select('#lodInfo').html();
            html += `LOD: ${minLOD}-${maxLOD} loaded <br>`;
            d3.select('#lodInfo').html(html);
          }
          const xhrresponse = /** @type {!ArrayBuffer}*/(xhr.response);
          gmf.lidarProfile.loader.processBuffer(xhrresponse, iter, distanceOffset, lastLOD, resetPlot);
        }
      }
    }
  };

  try {
    gmf.lidarProfile.loader.requestsQueue.push(xhr);
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
gmf.lidarProfile.loader.processBuffer = function(profile, iter, distanceOffset, lastLOD, resetPlot) {

  try {

    const typedArrayInt32 = new Int32Array(profile, 0, 4);
    const headerSize = typedArrayInt32[0];

    const uInt8header = new Uint8Array(profile, 4, headerSize);
    let strHeaderLocal = '';
    for (let i = 0; i < uInt8header.length; i++) {
      strHeaderLocal += String.fromCharCode(uInt8header[i]);
    }

    const jHeader = JSON.parse(strHeaderLocal);
    gmf.lidarProfile.options.profileConfig.pointSum += jHeader['points'];
    if (gmf.lidarProfile.options.profileConfig.pointSum > gmf.lidarProfile.options.profileConfig.maxPoints) {
      gmf.lidarProfile.loader.abortPendingRequests();
    }

    const attr = jHeader['pointAttributes'];
    const attributes = [];
    for (let j = 0; j < attr.length; j++) {
      if (gmf.lidarProfile.options.profileConfig.pointAttributesRaw [attr[j]] != undefined) {
        attributes.push(gmf.lidarProfile.options.profileConfig.pointAttributesRaw[attr[j]]);
      }
    }
    const scale = jHeader['scale'];

    /**
    * @type {gmfx.LidarProfilePoint}
    */
    const points = {
      altitude: [],
      classification: [],
      color_packed: [],
      coords: [],
      distance: [],
      intensity: []
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
          gmf.lidarProfile.loader.profilePoints.distance.push(Math.round(100 * (distanceOffset + dist)) / 100);
          points.altitude.push(Math.round(100 * alti) / 100);
          gmf.lidarProfile.loader.profilePoints.altitude.push(Math.round(100 * alti) / 100);

        } else if (attributes[k]['value']  == 'CLASSIFICATION') {
          const classif = view.getUint8(aoffset);
          points.classification.push(classif);
          gmf.lidarProfile.loader.profilePoints.classification.push(classif);

        } else if (attributes[k]['value']  == 'INTENSITY') {
          const intensity = view.getUint8(aoffset);
          points.intensity.push(intensity);
          gmf.lidarProfile.loader.profilePoints.intensity.push(intensity);

        } else if (attributes[k]['value'] == 'COLOR_PACKED') {
          const r = view.getUint8(aoffset);
          const g = view.getUint8(aoffset + 1);
          const b = view.getUint8(aoffset + 2);
          points.color_packed.push([r, g, b]);
          gmf.lidarProfile.loader.profilePoints.color_packed.push([r, g, b]);

        } else if (attributes[k]['value']  == 'POSITION_CARTESIAN') {
          const x = view.getInt32(aoffset, true) * scale + jHeader['boundingBox']['lx'];
          const y = view.getInt32(aoffset + 4, true) * scale + jHeader['boundingBox']['ly'];
          points.coords.push([x, y]);
          gmf.lidarProfile.loader.profilePoints.coords.push([x, y]);
        }
        aoffset = aoffset + attributes[k]['bytes'];
      }
    }

    const rangeX = [0, gmf.lidarProfile.options.olLinestring.getLength()];
    // let rangeY = [gmf.lidarProfile.loader.arrayMin(points.altitude), gmf.lidarProfile.loader.arrayMax(points.altitude)];
    let rangeY = [jHeader['boundingBox']['lz'], jHeader['boundingBox']['uz']];

    // TODO fix z offset issue in cPotree here is an hugly fix:
    // for (let b = 0; b < points.altitude.length; b++) {
    //   points.altitude[b] = points.altitude[b] - rangeY[0] + jHeader.boundingBox.lz;
    //   gmf.lidarProfile.loader.profilePoints.altitude[b] = gmf.lidarProfile.loader.profilePoints.altitude[b] - rangeY[0] + jHeader.boundingBox.lz;
    // }

    rangeY = [gmf.lidarProfile.loader.arrayMin(points.altitude), gmf.lidarProfile.loader.arrayMax(points.altitude)];

    if (iter == 0 && resetPlot) {
      gmf.lidarProfile.plot2canvas.setupPlot(rangeX, rangeY);
      gmf.lidarProfile.plot2canvas.drawPoints(points, gmf.lidarProfile.options.profileConfig.defaultAttribute);

    } else {
      gmf.lidarProfile.plot2canvas.drawPoints(points, gmf.lidarProfile.options.profileConfig.defaultAttribute);
    }

  } catch (e) {
    console.log(e);
  }
};

/**
* @export
*/
gmf.lidarProfile.loader.updateData = function() {
  const scaleX = gmf.lidarProfile.options.profileConfig.scaleX;
  const scaleY = gmf.lidarProfile.options.profileConfig.scaleY;
  const domainX = scaleX.domain();
  const domainY = scaleY.domain();

  const clip = gmf.lidarProfile.utils.clipLineByMeasure(domainX[0], domainX[1]);
  const span = domainX[1] - domainX[0];
  const maxLODWidth = gmf.lidarProfile.utils.getNiceLOD(span);
  const xTolerance = 0.2;

  if (Math.abs(domainX[0] - gmf.lidarProfile.options.profileConfig.previousDomainX[0]) < xTolerance &&
      Math.abs(domainX[1] - gmf.lidarProfile.options.profileConfig.previousDomainX[1]) < xTolerance) {

    gmf.lidarProfile.plot2canvas.drawPoints(gmf.lidarProfile.loader.profilePoints,
      gmf.lidarProfile.options.profileConfig.defaultAttribute);
  } else {
    if (maxLODWidth.maxLOD <= gmf.lidarProfile.options.profileConfig.initialLOD) {
      gmf.lidarProfile.plot2canvas.drawPoints(gmf.lidarProfile.loader.profilePoints,
        gmf.lidarProfile.options.profileConfig.defaultAttribute);
    } else {
      gmf.lidarProfile.loader.getProfileByLOD(clip.distanceOffset, false, 0);

    }
  }

  gmf.lidarProfile.options.profileConfig.previousDomainX = domainX;
  gmf.lidarProfile.options.profileConfig.previousDomainY = domainY;

};


/**
* @export
*/
gmf.lidarProfile.loader.abortPendingRequests = function() {

  for (let i = 0; i < gmf.lidarProfile.loader.requestsQueue.length; i++) {
    gmf.lidarProfile.loader.requestsQueue[i].abort();
    gmf.lidarProfile.loader.requestsQueue.splice(i, 1);
  }
};

/**
* @param {Array.<number>} array of number
* @return {number} the maximum of input array
* @private
*/
gmf.lidarProfile.loader.arrayMax = function(array) {
  return array.reduce((a, b) => Math.max(a, b));
};

/**
* @param {Array.<number>} array of number
* @return {number} the minimum of input array
* @private
*/
gmf.lidarProfile.loader.arrayMin = function(array) {

  let minVal = Infinity;
  for (let i = 0; i < array.length; i++) {
    if (array[i] < minVal) {
      minVal = array[i];
    }
  }
  return minVal;
};

/**
* @private
* @return {string} uuid
*/
gmf.lidarProfile.loader.UUID = function() {
  let nbr, randStr = '';
  do {
    randStr += (nbr = Math.random()).toString(16).substr(2);
  } while (randStr.length < 30);
  return [
    randStr.substr(0, 8), '-',
    randStr.substr(8, 4), '-4',
    randStr.substr(12, 3), '-',
    ((nbr * 4 | 0) + 8).toString(16),
    randStr.substr(15, 3), '-',
    randStr.substr(18, 12)
  ].join('');
};

/**
* @private
* @param {ol.geom.LineString} line the profile 2D line
* @return {string} linestring in a cPotree/pytree compatible string definition
*/
gmf.lidarProfile.loader.getPytreeLinestring = function(line) {
  const coords = line.getCoordinates();
  let pytreeLineString = '';
  for (let i = 0; i < coords.length; i++) {
    const px = coords[i][0];
    const py = coords[i][1];
    pytreeLineString += `{${Math.round(100 * px) / 100}, ${Math.round(100 * py) / 100}},`;
  }
  return pytreeLineString.substr(0, pytreeLineString.length - 1);
};
