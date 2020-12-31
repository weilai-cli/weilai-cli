'use strict';

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
}

module.exports = {
    isObject,
    isArray
};

