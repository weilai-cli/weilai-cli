'use strict';

const log = require('@weilai-cli/log')
const Package = require('@weilai-cli/package')

const SETTINGS = {
    init: '@weilai-cli/init'
}

function exec(...argm) {
    const homePath = process.env.CLI_HOME_PATH
    const targetPath = process.env.CLI_TARGET_PATH
    log.verbose('homePath', homePath)
    log.verbose('targetPath', targetPath)

    const cmdObj = argm.pop()
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'

    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion
    })
    console.log(pkg.getRootFile())
}

module.exports = exec;
