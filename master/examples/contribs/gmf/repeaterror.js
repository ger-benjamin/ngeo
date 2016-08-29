


/** @const **/
var app = {};


/** @type {!angular.Module} **/
app.module = angular.module('app', ['gmf']);


/**
 * @constructor
 */
app.MainController = function() {

  /**
   * @type {Array.<string>}
   * @export
   */
  this.items = [{
      'title': '[A]',
    }, {
      'title': '[B]',
    }, {
      'title': '[C]',
    }, {
      'title': '[D]',
    }, {
      'title': '[E]'
    }];

  /**
   * @type {Array.<string>}
   * @export
   */
  this.removedItems = [];

  /**
   * @param {string} item Item to remove
   * @export
   */
  this.removeItem = function(item) {
    this.removedItems.push(item);
    var index = this.items.indexOf(item);
    if (index > -1) {
      var removedItem = this.items.splice(index, 1);
    }
  }
};


app.module.controller('MainController', app.MainController);
