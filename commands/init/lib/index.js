'use strict';

const log = require("@weilai-cli/log")
const Command = require('@weilai-cli/command')

class initCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        log.verbose('projectName', this.projectName)
        log.verbose('force',this.force)
    }

    exec() {
        // init 的业务逻辑
        console.log('init 的业务逻辑')
    }
}

function init(argv) {
    return new initCommand(argv)
}

module.exports = init
module.exports.initCommand = initCommand
