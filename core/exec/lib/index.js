'use strict';

const path = require('path')

const log = require('@weilai-cli/log')
const Package = require('@weilai-cli/package')

const SETTINGS = {
    init: '@weilai-cli/init'
}

const CHCHE_DIR = 'dependencies'

async function exec(...argm) {
    let storePath, pkg
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)

    const cmdObj = argm[argm.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'

    if(!targetPath) {
        targetPath = path.resolve(homePath, CHCHE_DIR)
        storePath = path.resolve(homePath, 'node_modules')
        log.verbose('targetPath', targetPath)
        log.verbose('storePath', storePath)

        pkg = new Package({
            targetPath,
            storePath,
            packageName,
            packageVersion
        })

        if(await pkg.exists()) {
            // 更新
            log.verbose('package', '更新')
            await pkg.update()
        } else {
            // 安装
            log.verbose('package', '安装')
            await pkg.install()
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        })
    }

    const rootFile = pkg.getRootFile()
    rootFile && require(rootFile)(...argm)
}

module.exports = exec;
