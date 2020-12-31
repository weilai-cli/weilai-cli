'use strict';

const path = require('path')
const dedent = require("dedent")
const commander = require('commander')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists')

const log = require("@weilai-cli/log")
const { getNpmSemverVersions } = require('@weilai-cli/get-npm-info')

const exec = require('@weilai-cli/exec')

// require: .js/.json/.node
// .js -> module.exports/exports
// .json -> JSON.parse
// .node -> process.dlopen
// .any -> .js
const pkg = require("../package.json")
const constant = require('./const')

let args, config
const program = new commander.Command()

module.exports = core

async function core(argv) {
    try {
        await prepare()
        registerCommand()
    } catch(error) {
        log.error(error.message)
        log.verbose('error', error)
    }
}

// 注册命令
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目', false)
        .action(exec)

    // debug 模式监听
    program.on('option:debug', () => {
        log.level 
            = process.env.LOG_LEVEL 
            = program.debug
                ? 'verbose'
                : 'info'
    })

    program.on('option:targetPath', () => {
        process.env.CLI_TARGET_PATH = program.targetPath
    })

    // 监听未知命令
    program.on('command:*', (obj) => {
        const availableCommands = program.commands.map(cmd => cmd.name)
        log.warn('未知的命令:', obj[0])
        availableCommands.length && log.warn('可用命令:', availableCommands.join(','))
    })

    program.parse(process.argv)

    // 当没有命令和配置的时候打印帮助文档
    if(program.args && program.args.length < 1) {
        program.outputHelp()
        console.log() // 换行
    }

    log.verbose('args', program.args)
}

async function prepare() {
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
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
        config = dotenv.config({ path: dotenvPath })
    }
    
    createDefaultConfig()
    
    log.verbose('环境变量:', process.env.CLI_HOME_PATH)
}

// 创建默认的环境变量配置
function createDefaultConfig() {
    const cliConfig = { home: userHome }

    process.env.CLI_HOME_PATH
        = cliConfig['cliHome'] 
        = process.env.CLI_HOME
            ? path.join(userHome, process.env.CLI_HOME)
            : path.join(userHome, constant.DEFAULT_CLI_HOME)
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

// 检查 package 的版本
function checkPkgVersion() {
    log.info('cli', pkg.version)
}
