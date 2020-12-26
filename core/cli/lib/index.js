'use strict';

const path = require('path')
const dedent = require("dedent")
const yargs = require("yargs/yargs")
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists')

const { getNpmSemverVersions } = require('@weilai-cli/get-npm-info')
const log = require("@weilai-cli/log")

// require: .js/.json/.node
// .js -> module.exports/exports
// .json -> JSON.parse
// .node -> process.dlopen
// .any -> .js
const pkg = require("../package.json")
const constant = require('./const')

let args, config

module.exports = core

async function core(argv) {
    const cli = yargs()
    
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgs()
        checkEnv()
        await checkGlobalUpdate()
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

// 检查是否需要全局更新
async function checkGlobalUpdate() {
    const currentVersion = pkg.version
    const npmName = pkg.name
    const lastVersions = await getNpmSemverVersions(npmName, currentVersion)
    if(lastVersions && semver.gt(lastVersions, currentVersion)) {
        log.warn('更新提示', colors.yellow(
            dedent`
                请更新 ${npmName}
                当前版本: ${currentVersion}
                最新版本: ${lastVersions}
                更新命令: npm install -g ${npmName}@${lastVersions}
            `))
    }
}

// 环境变量检查
function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if(pathExists(dotenvPath)) {
        config = dotenv.config({
            path: dotenvPath
        })
    }
    
    createDefaultConfig()
    
    log.verbose('环境变量:', process.env.CLI_HOME_PATH)
}

// 创建默认的环境变量配置
function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }

    process.env.CLI_HOME_PATH = cliConfig['cliHome'] = process.env.CLI_HOME
        ? path.join(userHome, process.env.CLI_HOME)
        : path.join(userHome, constant.DEFAULT_CLI_HOME)
}

// 入参检查
function checkInputArgs() {
    args = require('minimist')(process.argv.slice(2))
    checkArgs(args)
}

// debug 模式判断
function checkArgs(args) {
    log.level = process.env.LOG_LEVEL = args.debug
        ? 'verbose'
        : 'info'
}

// 检查 用户主目录
function checkUserHome() {
    if(!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登陆用户主目录不存在'))
    }
}

// 检查登陆帐号的级别 以及 降级
function checkRoot() {
    require('root-check')()
}

// 检查 node 的版本
function checkNodeVersion() {
    const currentNodeVersion = process.version
    const lowestNodeVersion = constant.LOWEST_NODE_VERSION
    if(!semver.gte(currentNodeVersion, lowestNodeVersion)) {
        throw new Error(colors.red(`weilai-cli 需要安装 v${lowestNodeVersion} 以上版本的 Node.js`))
    }
    log.notice('node', process.version)
}

// 检查 package 的版本
function checkPkgVersion() {
    log.notice('cli', pkg.version)
}
