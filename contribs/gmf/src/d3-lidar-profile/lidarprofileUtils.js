goog.provide('gmf.lidarProfile.utils');


/**
* @constructor
* @param {Object} options to be defined in gmfx
* @param {Object} profilePoints to be defined in gmfx
*/
gmf.lidarProfile.utils = function(options, profilePoints) {

  this.options = options;

  this.profilePoints = profilePoints;

};

/**
* @param {ol.geom.LineString} linestring an OpenLayer Linestring
* @param {number} dLeft domain minimum
* @param {number} dRight domain maximum
* @return {{clippedLine: Array.<ol.Coordinate>, distanceOffset: number}} Object with clipped lined coordinates and left domain value
* @export
*/
gmf.lidarProfile.utils.prototype.clipLineByMeasure = function(linestring, dLeft, dRight) {

  const clippedLine = new ol.geom.LineString([]);
  let mileage_start = 0;
  let mileage_end = 0;

  const totalLength = this.options.olLinestring.getLength();
  const fractionStart = dLeft / totalLength;
  const fractionEnd = dRight / totalLength;

  linestring.forEachSegment((segStart, segEnd) => {

    const segLine = new ol.geom.LineString([segStart, segEnd]);
    mileage_end += segLine.getLength();

    if (dLeft == mileage_start) {
      clippedLine.appendCoordinate(segStart);
    } else if (dLeft > mileage_start && dLeft < mileage_end) {
      clippedLine.appendCoordinate(linestring.getCoordinateAt(fractionStart));
    }

    if (mileage_start > dLeft && mileage_start < dRight) {
      clippedLine.appendCoordinate(segStart);
    }

    if (dRight == mileage_end) {
      clippedLine.appendCoordinate(segEnd);
    } else if (dRight > mileage_start && dRight < mileage_end) {
      clippedLine.appendCoordinate(linestring.getCoordinateAt(fractionEnd));
    }

    mileage_start += segLine.getLength();

  });

  let profileWidth;
  if (this.options.profileConfig.autoWidth) {
    profileWidth = this.getNiceLOD(clippedLine.getLength()).width;
  } else {
    profileWidth = this.options.profileConfig.profilWidth;
  }
  const feat = new ol.Feature({
    geometry: clippedLine
  });

  const widthInMapsUnits = profileWidth / this.options.map.getView().getResolution();

  const lineStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255,0,0,1)',
      width: widthInMapsUnits,
      lineCap: 'square'
    })
  });

  let firstSegmentAngle = 0;
  let lastSegementAngle = 0;
  const segNumber = clippedLine.getCoordinates.length - 1;
  let segCounter = 0;
  clippedLine.forEachSegment((end, start) => {
    if (segCounter == 0) {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      firstSegmentAngle = Math.atan2(dy, dx);
    }
    if (segCounter == segNumber) {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      lastSegementAngle = Math.atan2(dy, dx);
    }
    segCounter += 1;
  });

  const styles = [lineStyle];
  const lineEnd = clippedLine.getLastCoordinate();
  const lineStart = clippedLine.getFirstCoordinate();

  styles.push(
    new ol.style.Style({
      geometry: new ol.geom.Point(lineEnd),
      image: new ol.style.RegularShape({
        fill: new ol.style.Fill({
          color: 'rgba(255, 0, 0, 1)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255,0,0,1)',
          width: 1,
          lineCap: 'square'
        }),
        points: 3,
        radius: 5,
        rotation: firstSegmentAngle,
        angle: 0
      })
    }),
    new ol.style.Style({
      geometry: new ol.geom.Point(lineStart),
      image: new ol.style.RegularShape({
        fill: new ol.style.Fill({
          color: 'rgba(255, 0, 0, 1)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255,0,0,1)',
          width: 1,
          lineCap: 'square'
        }),
        points: 3,
        radius: 5,
        rotation: lastSegementAngle,
        angle: 0
      })
    })
  );
  const vectorSource = new ol.source.Vector({
    features: [feat]
  });

  return {
    clippedLine: clippedLine.getCoordinates(),
    distanceOffset: dLeft,
    bufferGeom: vectorSource,
    bufferStyle: styles
  };
};

/**
* @param {number} span domain extent
* @return {{maxLOD: number, width: number}} Object with optimized LOD and width for this profile span
* @export
*/
gmf.lidarProfile.utils.prototype.getNiceLOD = function(span) {
  let maxLOD = 0;
  let width;
  const levels = this.options.profileConfig.maxLevels;
  for (const key in levels) {
    if (span < key && levels[key].max > maxLOD) {
      maxLOD = levels[key].max;
      width = levels[key].width;
    }
  }
  return {
    maxLOD,
    width
  };
};

/**
* @param {string} filename csv file name
* @param {string} dataUrl fake url from which to download the csv file
* @export
*/
gmf.lidarProfile.utils.prototype.downloadDataUrlFromJavascript = function(filename, dataUrl) {

  const link = document.createElement('a');
  link.download = filename;
  link.target = '_blank';
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
* @export
*/
gmf.lidarProfile.utils.prototype.exportToImageFile = function() {
  const margin = this.options.profileConfig.margin;
  const svg = d3.select('#profileSVG').node();
  const img = new Image();
  const DOMURL = window.URL || window.webkitURL || window;
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const svgImage = new Blob([svgStr], {type: 'image/svg+xml'});
  const canvas = document.createElement('canvas');
  const url = DOMURL.createObjectURL(svgImage);
  const that = this;
  img.onload = function() {
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    const w = d3.select('#profileSVG').attr('width');
    const h = d3.select('#profileSVG').attr('height');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    const pointsCanvas = d3.select('#profileCanvas').node();
    canvas.getContext('2d').drawImage(pointsCanvas, margin.left, margin.top, w - (margin.left + margin.right), h - (margin.top + margin.bottom));
    ctx.drawImage(img, 0, 0, w, h);
    const dataURL = canvas.toDataURL();

    that.downloadDataUrlFromJavascript('sitn_profile.png', dataURL);

    DOMURL.revokeObjectURL(url);
  };
  img.src = url;
};

/**
* @param {gmfx.LidarProfilePoints} profilePoints points
* @export
*/
gmf.lidarProfile.utils.prototype.getPointsInProfileAsCSV = function() {

  const profilePoints = this.profilePoints;

  let file = 'data:text/csv;charset=utf-8,';

  /**
   * @type {Array}
   */
  const points = [];
  for (let i = 0; i < profilePoints.distance.length; i++) {
    /**
     * @type {gmfx.lidarPoint}
     */
    const p = {
      distance: profilePoints.distance[i],
      altitude: profilePoints.altitude[i],
      color_packed: profilePoints.color_packed[i],
      intensity: profilePoints.intensity[i],
      classification: profilePoints.classification[i],
      coords: profilePoints.coords[i]
    };

    points.push(p);

  }

  points.sort((a, b) => (a.distance - b.distance));

  {
    let header = '';
    if (points[0].hasOwnProperty('x')) {
      header += ', x';
    }
    if (points[0].hasOwnProperty('y')) {
      header += ', y';
    }
    if (points[0].hasOwnProperty('distance')) {
      header += ', distance';
    }
    if (points[0].hasOwnProperty('altitude')) {
      header += ', altitude';
    }
    if (points[0].hasOwnProperty('color_packed')) {
      header += ', r, g, b';
    }

    if (points[0].hasOwnProperty('intensity')) {
      header += ', intensity';
    }

    if (points[0].hasOwnProperty('classification')) {
      header += ', classification';
    }

    if (points[0].hasOwnProperty('numberOfReturns')) {
      header += ', numberOfReturns';
    }

    if (points[0].hasOwnProperty('pointSourceID')) {
      header += ', pointSourceID';
    }

    if (points[0].hasOwnProperty('returnNumber')) {
      header += ', returnNumber';
    }
    file += `${header.substr(2)} \n`;
  }

  let point = {
    distance: -1,
    altitude: -1,
    color_packed: [],
    intensity: -1,
    classification: -1,
    numberOfReturns: -1,
    pointSourceID: -1,
    returnNumber: -1
  };

  for (point of points) {
    let line = `${point.distance.toFixed(4)}, `;
    line += `${point.altitude.toFixed(4)}, `;

    if (point.hasOwnProperty('color_packed')) {
      line += point.color_packed.join(', ');
    }

    if (point.hasOwnProperty('intensity')) {
      line += `, ${point.intensity}`;
    }

    if (point.hasOwnProperty('classification')) {
      line += `, ${point.classification}`;
    }

    if (point.hasOwnProperty('numberOfReturns')) {
      line += `, ${point.numberOfReturns}`;
    }

    if (point.hasOwnProperty('pointSourceID')) {
      line += `, ${point.pointSourceID}`;
    }

    if (point.hasOwnProperty('returnNumber')) {
      line += `, ${point.returnNumber}`;
    }

    line += '\n';

    file = file + line;
  }

  const encodedUri = encodeURI(file);
  this.downloadDataUrlFromJavascript('sitn_profile.csv', encodedUri);

};


/**
* @param {(Array.<number>|undefined)} array of number
* @return {number} the maximum of input array
* @private
*/
gmf.lidarProfile.utils.prototype.arrayMax = function(array) {
  return array.reduce((a, b) => Math.max(a, b));
};

/**
* @param {Array.<number>|undefined} array of number
* @return {number} the minimum of input array
* @private
*/
gmf.lidarProfile.utils.prototype.arrayMin = function(array) {

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
gmf.lidarProfile.utils.prototype.UUID = function() {
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
gmf.lidarProfile.utils.prototype.getPytreeLinestring = function(line) {
  const coords = line.getCoordinates();
  let pytreeLineString = '';
  for (let i = 0; i < coords.length; i++) {
    const px = coords[i][0];
    const py = coords[i][1];
    pytreeLineString += `{${Math.round(100 * px) / 100}, ${Math.round(100 * py) / 100}},`;
  }
  return pytreeLineString.substr(0, pytreeLineString.length - 1);
};

/**
 * Find the profile's closest point to the mouse position
 * @param {gmfx.LidarProfilePoints} points Object containing points properties as arrays
 * @param {number} xs mouse x coordinate on canvas element
 * @param {number} ys mouse y coordinate on canvas element
 * @param {number} tolerance snap sensibility
 * @return {gmfx.lidarPoint} closestPoint the closest point to the clicked coordinates
 * @export
*/
gmf.lidarProfile.utils.prototype.getClosestPoint = function(points, xs, ys, tolerance) {
  const d = points;
  const tol = tolerance;
  const sx = this.options.profileConfig.scaleX;
  const sy = this.options.profileConfig.scaleY;
  const distances = [];
  const hP = [];

  for (let i = 0; i < d.distance.length; i++) {
    if (sx(d.distance[i]) < xs + tol && sx(d.distance[i]) > xs - tol && sy(d.altitude[i]) < ys + tol && sy(d.altitude[i]) > ys - tol) {

      const pDistance =  Math.sqrt(Math.pow((sx(d.distance[i]) - xs), 2) + Math.pow((sy(d.altitude[i]) - ys), 2));
      const cClassif = this.options.profileConfig.classification[d.classification[i].toString()];
      if (cClassif && cClassif.visible == 1) {

        hP.push({
          distance: d.distance[i],
          altitude: d.altitude[i],
          classification: d.classification[i],
          color_packed: d.color_packed[i],
          intensity: d.intensity[i],
          coords: d.coords[i]
        });
        distances.push(pDistance);

      }
    }
  }

  let closestPoint;

  if (hP.length > 0) {
    const minDist = Math.min(distances);
    const indexMin = distances.indexOf(minDist);
    if (indexMin != -1) {
      closestPoint = hP[indexMin];
    } else {
      closestPoint = hP[0];
    }
  }
  return closestPoint;
};
