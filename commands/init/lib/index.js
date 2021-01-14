'use strict';

const fs = require('fs')
const path = require('path')

const fsExtra = require('fs-extra')
const inquirer = require('inquirer')
const sermver = require('semver')
const userHome = require('user-home')

const log = require("@weilai-cli/log")
const Command = require('@weilai-cli/command')
const Package = require('@weilai-cli/package')
const { spinnerStart, sleep } = require('@weilai-cli/utils')

const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

class initCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        log.verbose('projectName', this.projectName)
        log.verbose('force',this.force)
    }

    async exec() {
        try {
            // 1. 准备阶段
            const projectInfo = this.projectInfo = await this.prepare()
            log.verbose('projectInfo', projectInfo)
            if(projectInfo) {
                // 2. 下载模板
                await this.downloadTemplate()
                // 3. 安装模板
            }
        } catch (e) {
            log.error(e.message)
        }
    }

    // 准备阶段
    async prepare() {
        const localPath = process.cwd()

        // 0. 判断项目模板是否存在
        const template = this.template = await getProjectTemplate()
        log.verbose('template', template)
        if(!Array.isArray(template) || template.length === 0) {
            throw new Error('项目模板不存在')
        }

        // 1. 判断当前目录是否为空
        if(!this.isCwdEmpty(localPath)) {
            // 2. 询问是否启动强制更新
            let ifContinue
            if(!this.force) {
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContinue
                
                // 终止流程
                if(!ifContinue) return false
            }

            if( ifContinue || this.force ) {
                // 二次确认
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？'
                })

                if(confirmDelete) {
                    // 清空当前目录
                    fsExtra.emptyDirSync(localPath)
                }
            }
        }
        
        // 项目的基本信息
        return this.getProjectInfo()
    }

    // 获取项目信息
    async getProjectInfo() {
        let projectInfo = {}

        // 1. 选择创建项目或者组件
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [
                { name: '项目', value: TYPE_PROJECT },
                { name: '组件', value: TYPE_COMPONENT}
            ]
        })

        // 2. 获取项目的基本信息
        if(type === TYPE_PROJECT) {
            const project = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        // 1. 首字符必须为英文
                        // 2. 尾字符必须为英文和数字
                        // 3. 字符仅允许'-_'
                        if(!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                            return done('请输入合法的项目名称')
                        }
                        done(null, true)
                    })
                },
                filter: (v) => {
                    return v
                }
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        if(!sermver.valid(v)) {
                            return done('请输入合法的版本号')
                        }
                        done(null, true)
                    })
                },
                filter: (v) => {
                    if(!!sermver.valid(v)) {
                        return sermver.valid(v)
                    }

                    return v
                }
            }, {
                type: 'list',
                name: 'projectTemplate',
                message: '请选择项目模板',
                choices: this.createTemplateChoice()
            }])

            projectInfo = {
                type,
                ...project
            }
        } else if(type === TYPE_COMPONENT) {

        }

        return projectInfo
    }

    createTemplateChoice() {
        return this.template.map(item => ({ name: item.name, value: item.npmName }))
    }

    // 下载模板
    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome, '.weilai-cli', 'template')
        const storePath = path.resolve(userHome, '.weilai-cli', 'template', 'node_modules')
        const { npmName: packageName, version: packageVersion } = templateInfo
        const templateNpm = new Package({
            targetPath,
            storePath,
            packageName,
            packageVersion
        })

        // 判断 package 是否存在
        const spinner = spinnerStart('正在下载模板...')
        await sleep()
        try {
            if(!await templateNpm.exists()) {
                // 不存在 安装
                await templateNpm.install()
                log.notice('下载模板成功!')
            } else {
                // 存在 更新
                await templateNpm.update()
                log.notice('更新模板成功!')
            }
        } catch (e) {
            throw e
        } finally {
            spinner.stop(true)
        }
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
