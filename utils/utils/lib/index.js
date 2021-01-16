'use strict';

const cp = require('child_process')

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

function spawn(command, args, options) {
    const win32 = process.platform === 'win32'

    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args

    return cp.spawn(cmd, cmdArgs, options || {})
}

module.exports = {
    isObject,
    isArray,
    spinnerStart,
    sleep,
    spawn
};

