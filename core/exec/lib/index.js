'use strict';

const cp = require('child_process')
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
    
    if(rootFile) {
        try {
            // 当前进程
            // rootFile && require(rootFile)(argm)
            // 子进程
            const o = Object.create(null)
            Object.keys(cmdObj).forEach(key => {
                if(
                    cmdObj.hasOwnProperty(key) &&
                    !key.startsWith('_') &&
                    key !== 'parent'
                ) {
                    o[key] = cmdObj[key]
                }
            })
            argm[argm.length - 1] = o
            const code = `require('${rootFile}')(${JSON.stringify(argm)})`
            const child = spawn('node', [ '-e', code ], {
                cwd: process.cwd(),
                stdio: 'inherit' // 这个属性是把子进程的输出流直接挂载到父进程
            })
    
            child.on('error', e => {
                log.error(e.message)
                process.exit(1)
            })
    
            child.on('exit', e => {
                log.verbose('命令执行成功:', e)
                process.exit(e)
            })
        } catch(err) {
            log.error(err.message)
        }
    }
}

function spawn(command, args, options) {
    const win32 = process.platform === 'win32'

    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args

    return cp.spawn(cmd, cmdArgs, options || {})
}

module.exports = exec;
