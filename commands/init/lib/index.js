'use strict';

const fs = require('fs')
const fsExtra = require('fs-extra')
const inquirer = require('inquirer')

const log = require("@weilai-cli/log")
const Command = require('@weilai-cli/command')

class initCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        log.verbose('projectName', this.projectName)
        log.verbose('force',this.force)
    }

    async exec() {
        try {
            // init 的业务逻辑
            log.verbose('init 的业务逻辑')

            // 1. 准备阶段
            await this.prepare()
            // 2. 下载模板
            // 3. 安装模板
        } catch (e) {
            log.error(e.message)
        }
    }

    // 准备阶段
    async prepare() {
        const localPath = process.cwd()
        // 1. 判断当前目录是否为空
        if(!this.isCwdEmpty(localPath)) {
            // 2. 询问是否启动强制更新
            const { ifContinue } = await inquirer.prompt({
                type: 'confirm',
                name: 'ifContinue',
                default: false,
                message: '当前文件夹不为空，是否继续创建项目？'
            })
            console.log(ifContinue)
            if( ifContinue ) {
                // 清空当前目录
                fsExtra.emptyDirSync(localPath)
            }
        }
        
        // 3. 选择创建项目或者组件
        // 4. 获取项目的基本信息

    }

    // 判断当前目录是否为空
    isCwdEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        // 文件过滤的逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && !['node_modules'].includes(file)
        ))
        return !fileList || fileList.length <= 0
    }
}

function init(argv) {
    return new initCommand(argv)
}

module.exports = init
module.exports.initCommand = initCommand
