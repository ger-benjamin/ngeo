goog.provide('gmf.lidarProfile.utils');

/**
* @param {number} dLeft domain minimum
* @param {number} dRight domain maximum
* @return {{clippedLine: Array.<ol.Coordinate>, distanceOffset: number}} Object with clipped lined coordinates and left domain value
* @export
*/
gmf.lidarProfile.utils.clipLineByMeasure = function(dLeft, dRight) {

  const clippedLine = new ol.geom.LineString([]);
  let mileage_start = 0;
  let mileage_end = 0;

  const totalLength = gmf.lidarProfile.options.olLinestring.getLength();
  const fractionStart = dLeft / totalLength;
  const fractionEnd = dRight / totalLength;

  gmf.lidarProfile.options.olLinestring.forEachSegment((segStart, segEnd) => {

    const segLine = new ol.geom.LineString([segStart, segEnd]);
    mileage_end += segLine.getLength();

    if (dLeft == mileage_start) {
      clippedLine.appendCoordinate(segStart);
    } else if (dLeft > mileage_start && dLeft < mileage_end) {
      clippedLine.appendCoordinate(gmf.lidarProfile.options.olLinestring.getCoordinateAt(fractionStart));
    }

    if (mileage_start > dLeft && mileage_start < dRight) {
      clippedLine.appendCoordinate(segStart);
    }

    if (dRight == mileage_end) {
      clippedLine.appendCoordinate(segEnd);
    } else if (dRight > mileage_start && dRight < mileage_end) {
      clippedLine.appendCoordinate(gmf.lidarProfile.options.olLinestring.getCoordinateAt(fractionEnd));
    }

    mileage_start += segLine.getLength();

  });

  let profileWidth;
  if (gmf.lidarProfile.options.profileConfig.autoWidth) {
    profileWidth = gmf.lidarProfile.utils.getNiceLOD(clippedLine.getLength()).width;
  } else {
    profileWidth = gmf.lidarProfile.options.profileConfig.profilWidth;
  }
  const feat = new ol.Feature({
    geometry: clippedLine
  });

  const widthInMapsUnits = profileWidth / gmf.lidarProfile.options.map.getView().getResolution();

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
  gmf.lidarProfile.loader.lidarBuffer.setSource(null);
  gmf.lidarProfile.loader.lidarBuffer.setSource(vectorSource);
  gmf.lidarProfile.loader.lidarBuffer.setStyle(styles);

  return {
    clippedLine: clippedLine.getCoordinates(),
    distanceOffset: dLeft
  };
};

/**
* @param {number} span domain extent
* @return {{maxLOD: number, width: number}} Object with optimized LOD and width for this profile span
* @export
*/
gmf.lidarProfile.utils.getNiceLOD = function(span) {
  let maxLOD = 0;
  let width;
  const levels = gmf.lidarProfile.options.profileConfig.maxLevels;
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
gmf.lidarProfile.utils.downloadDataUrlFromJavascript = function(filename, dataUrl) {

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
gmf.lidarProfile.utils.exportToImageFile = function() {
  const margin = gmf.lidarProfile.options.profileConfig.margin;
  const svg = d3.select('#profileSVG').node();
  const img = new Image();
  const DOMURL = window.URL || window.webkitURL || window;
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const svgImage = new Blob([svgStr], {type: 'image/svg+xml'});
  const canvas = document.createElement('canvas');
  const url = DOMURL.createObjectURL(svgImage);

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
    gmf.lidarProfile.utils.downloadDataUrlFromJavascript('sitn_profile.png', dataURL);
    DOMURL.revokeObjectURL(url);
  };
  img.src = url;
};

/**
* @param {gmfx.LidarProfilePoint} profilePoints points
* @export
*/
gmf.lidarProfile.utils.getPointsInProfileAsCSV = function(profilePoints) {

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
      classification: profilePoints.classification[i]
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
  gmf.lidarProfile.utils.downloadDataUrlFromJavascript('sitn_profile.csv', encodedUri);

};
