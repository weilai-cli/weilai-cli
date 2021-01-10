'use strict';



function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
}

function spinnerStart(msg, spinnerString = '|/-\\') {
    const Spinner = require('cli-spinner').Spinner
    const spinner = new Spinner(msg + ' %s')
    spinner.setSpinnerString(spinnerString)
    spinner.start()
    return spinner
}

function sleep(time = 1000) {
    return new Promise(resolve => setTimeout(resolve, time))
}

module.exports = {
    isObject,
    isArray,
    spinnerStart,
    sleep
};

