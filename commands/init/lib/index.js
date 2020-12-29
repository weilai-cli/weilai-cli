'use strict';

const log = require("@weilai-cli/log")

module.exports = initCommandAction


function initCommandAction(projectName, cmdObj) {
    log.notice('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH)
}
