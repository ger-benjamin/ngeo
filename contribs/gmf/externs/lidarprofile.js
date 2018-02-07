/**
 * Externs for a LIDARD profile web service.
 *
 * @externs
 */


/**
 * @type {Object}
 */
let lidarProfileServer;


/**
 * @typedef {Object.<number, !lidarProfileServer.ConfigClassification>}
 */
lidarProfileServer.ConfigClassifications;

/**
 * @constructor
 * @struct
 */
lidarProfileServer.ConfigClassification = function() {};

/**
 * @type (string|undefined)
 */
lidarProfileServer.ConfigClassification.prototype.color;

/**
 * @type (string|undefined)
 */
lidarProfileServer.ConfigClassification.prototype.name;

/**
 * @type (string|undefined)
 */
lidarProfileServer.ConfigClassification.prototype.value;

/**
 * @type (boolean|undefined)
 */
lidarProfileServer.ConfigClassification.prototype.visible;


/**
 * @typedef {!Object<number, !lidarProfileServer.ConfigLevel>}
 */
lidarProfileServer.ConfigLevels;

/**
 * @constructor
 * @struct
 */
lidarProfileServer.ConfigLevel = function() {};

/**
 * @type (number|undefined)
 */
lidarProfileServer.ConfigLevel.prototype.max;

/**
 * @type (number|undefined)
 */
lidarProfileServer.ConfigLevel.prototype.width;


/**
 * @typedef {Object.<string, !lidarProfileServer.ConfigPointAttribute>}
 */
lidarProfileServer.ConfigPointAttributes;

/**
 * @constructor
 * @struct
 */
lidarProfileServer.ConfigPointAttribute = function() {};

/**
 * @type (number|undefined)
 */
lidarProfileServer.ConfigPointAttribute.prototype.bytes;

/**
 * @type (number|undefined)
 */
lidarProfileServer.ConfigPointAttribute.prototype.elements;

/**
 * @type (string|undefined)
 */
lidarProfileServer.ConfigPointAttribute.prototype.name;

/**
 * @type (string|undefined)
 */
lidarProfileServer.ConfigPointAttribute.prototype.value;

/**
 * @type (number|undefined)
 */
lidarProfileServer.ConfigPointAttribute.prototype.visible;


/**
 * @constructor
 * @struct
 */
lidarProfileServer.Config = function() {};

/**
 * @type (Object.<number, string>|undefined)
 */
lidarProfileServer.Config.prototype.classes_names_normalized;

/**
 * @type (Object.<number, string>|undefined)
 */
lidarProfileServer.Config.prototype.classes_names_standard;

/**
 * @type (lidarProfileServer.ConfigClassifications|undefined)
 */
lidarProfileServer.Config.prototype.classification_colors;

/**
 * @type (boolean|undefined)
 */
lidarProfileServer.Config.prototype.debug;

/**
 * @type (string|undefined)
 */
lidarProfileServer.Config.prototype.default_attribute;

/**
 * @type (string|undefined)
 */
lidarProfileServer.Config.prototype.default_color;

/**
 * @type (string|undefined)
 */
lidarProfileServer.Config.prototype.default_point_attribute;

/**
 * @type (string|undefined)
 */
lidarProfileServer.Config.prototype.default_point_cloud;

/**
 * @type (number|undefined)
 */
lidarProfileServer.Config.prototype.initialLOD;

/**
 * @type (lidarProfileServer.ConfigLevels|undefined)
 */
lidarProfileServer.Config.prototype.max_levels;

/**
 * @type (number|undefined)
 */
lidarProfileServer.Config.prototype.max_point_number;

/**
 * @type (number|undefined)
 */
lidarProfileServer.Config.prototype.minLOD;

/**
 * @type (lidarProfileServer.ConfigPointAttributes|undefined)
 */
lidarProfileServer.Config.prototype.point_attributes;

/**
 * @type (number|undefined)
 */
lidarProfileServer.Config.prototype.point_size;

/**
 * @type (number|undefined)
 */
lidarProfileServer.Config.prototype.vertical_pan_tolerance;

/**
 * @type (number|undefined)
 */
lidarProfileServer.Config.prototype.width;
