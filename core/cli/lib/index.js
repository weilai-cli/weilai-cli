'use strict';

const dedent = require("dedent")
const yargs = require("yargs/yargs")
const semver = require('semver')
const colors = require('colors/safe')

const log = require("@weilai-cli/log")

// require: .js/.json/.node
// .js -> module.exports/exports
// .json -> JSON.parse
// .node -> process.dlopen
// .any -> .js
const pkg = require("../package.json")
const constant = require('./const')

module.exports = core

function core(argv) {
    const cli = yargs()
    
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
    } catch(error) {
        log.error(error.message)
    }

    const context = {
        weilaiCliVersion: pkg.version,
    }

    return cli
        .usage("Usage: $0 <command> [options]")
        .demandCommand(1, "最少需要输入一个命令。 通过 --help 查看所有可用的命令和选项。")
        .recommendCommands()
        .strict()
        .fail((err, msg) => {
            // log.error(err)
        })
        .alias('h', 'help')
        .alias('v', 'version')
        .wrap(cli.terminalWidth())
        .epilogue(
            dedent`
                天道酬勤！加油！
                求内推！
            `
        )
        .parse(argv, context)
}

function checkRoot() {
    console.log(process.geteuid())
}

// 检查 node 的版本
function checkNodeVersion() {
    const currentNodeVersion = process.version
    const lowestNodeVersion = constant.LOWEST_NODE_VERSION
    console.log('lowestNodeVersion:', semver.gte(currentNodeVersion, lowestNodeVersion))
    if(!semver.gte(currentNodeVersion, lowestNodeVersion)) {
        throw new Error(colors.red(`weilai-cli 需要安装 v${lowestNodeVersion} 以上版本的 Node.js`))
    }
    log.notice('node', process.version)
}

// 检查 package 的版本
function checkPkgVersion() {
    log.notice('cli', pkg.version)
}
