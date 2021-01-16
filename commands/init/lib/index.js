'use strict';

const fs = require('fs')
const path = require('path')

const fsExtra = require('fs-extra')
const inquirer = require('inquirer')
const sermver = require('semver')
const userHome = require('user-home')
const glob = require('glob')
const ejs = require('ejs')

const log = require("@weilai-cli/log")
const Command = require('@weilai-cli/command')
const Package = require('@weilai-cli/package')
const { spinnerStart, sleep, spawnAsync } = require('@weilai-cli/utils')

const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'
const WHITE_COMMAND = ['npm', 'cnpm']

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
                await this.installTemplate()
            }
        } catch (e) {
            log.error(e.message)
            if(process.env.LOG_LEVEL === 'verbose') {
                console.log(e)
            }
        }
    }

    // 准备阶段
    async prepare() {
        const localPath = process.cwd()

        // 0. 判断项目模板是否存在
        const spinner = spinnerStart('正在获取模板信息...')
        const template = this.template = await getProjectTemplate()
        spinner.stop(true)
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
                    const spinner = spinnerStart('正在清空当前目录...')
                    fsExtra.emptyDirSync(localPath)
                    spinner.stop(true)
                }
            }
        }
        
        // 项目的基本信息
        return this.getProjectInfo()
    }

    // 获取项目信息
    async getProjectInfo() {
        function isValidName(v) {
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
        }

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

        log.verbose('project class', type)
        const title = type === TYPE_PROJECT ? '项目' : '组件'
        this.template = this.template.filter(template => template.tag.includes(type))

        const projectPrompt = [
            {
                type: 'input',
                name: 'projectName',
                message: `请输入${title}名称`,
                default: this.projectName ? this.projectName : '',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        // 1. 首字符必须为英文
                        // 2. 尾字符必须为英文和数字
                        // 3. 字符仅允许'-_'
                        if(!isValidName(v)) {
                            return done(`请输入合法的${title}名称`)
                        }
                        done(null, true)
                    })
                },
                filter: (v) => {
                    return v
                }
            },
            {
                type: 'input',
                name: 'projectVersion',
                message: `请输入${title}版本号`,
                default: '1.0.0',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        if(!sermver.valid(v)) {
                            return done(`请输入合法的版本号`)
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
                message: `请选择${title}模板`,
                choices: this.createTemplateChoice()
            }
        ]

        // 2. 获取项目的基本信息
        if(type === TYPE_PROJECT) {

            const project = await inquirer.prompt(projectPrompt)

            projectInfo = { type, ...projectInfo, ...project }
        } else if(type === TYPE_COMPONENT) {
            const descriptionPrompt = {
                type: 'input',
                name: 'componentDescription',
                message: '请输入组件描述信息',
                default: '',
                validate: function(v) {
                    const done = this.async()
                    setTimeout(() => {
                        if(!(v)) {
                            return done('请输入组件描述信息')
                        }
                        done(null, true)
                    })
                }
            }

            projectPrompt.push(descriptionPrompt)

            const project = await inquirer.prompt(projectPrompt)

            projectInfo = { type, ...projectInfo, ...project }
        }

        
        if(projectInfo.projectName) {
            projectInfo.name = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
        }
        
        if(projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion
        }

        if(projectInfo.componentDescription) {
            projectInfo.description = projectInfo.componentDescription
        }

        return projectInfo
    }

    // 创建模板的选择列表
    createTemplateChoice() {
        return this.template.map(item => ({ name: item.name, value: item.npmName }))
    }

    // 下载模板
    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo
        this.templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome, '.weilai-cli', 'template')
        const storePath = path.resolve(userHome, '.weilai-cli', 'template', 'node_modules')
        const { npmName: packageName, version: packageVersion } = this.templateInfo
        const templateNpm = this.templateNpm = new Package({
            targetPath,
            storePath,
            packageName,
            packageVersion
        })

        // 判断 package 是否存在
        let flag = await templateNpm.exists()
        const spinner = spinnerStart('正在下载模板...')
        await sleep()
        try {
            if(!flag) {
                // 不存在 安装
                await templateNpm.install()
            } else {
                // 存在 更新
                await templateNpm.update()
            }
        } catch (e) {
            throw e
        } finally {
            spinner.stop(true)
            flag ? log.success('更新模板成功') : log.success('下载模板成功')
        }
    }

    // 安装模板
    async installTemplate() {
        if(this.templateInfo) {
            if(this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                // 标准安装
                await this.installNormalTemplate()
            } else if(this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                // 自定义安装
                await this.installCustomTemplate()
            } else {
                throw new Error('项目模板信息类型无法识别')
            }
        } else {
            throw new Error('项目模板信息不存在')
        }
    }

    // 标准安装
    async installNormalTemplate() {
        log.verbose('安装标准模板')
        log.verbose('templateNpm', this.templateNpm)
        // 拷贝模板代码到当前目录
        const spinner = spinnerStart('正在安装模板...')
        const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
        const targetPath = process.cwd()
        await sleep()
        try {
            fsExtra.ensureDirSync(templatePath) // 确保目录存在
            fsExtra.ensureDirSync(targetPath) // 确保目录存在
            fsExtra.copySync(templatePath, targetPath) // 拷贝到 targetPath 目录下
        } catch (e) {
            throw e
        } finally {
            spinner.stop(true)
            log.success('模板安装成功')
        }

        const templateIgnore = this.templateInfo.ignore || []
        const ignore = ['**/node_modules/**', ...templateIgnore]
        await this.ejsRender({ignore})

        const { installCommand, startCommand } = this.templateInfo
        let installCmdRet, startCmdRet

        // 依赖安装
        await this.execCommand(installCommand, '依赖安装失败')

        // 启动命令执行
        await this.execCommand(startCommand, '启动命令执行失败')
    }

    // 自定义安装
    async installCustomTemplate() {
        log.verbose('安装自定义模板') 
    }

    // 执行命令
    async execCommand(command, errMsg) {
        if(command) {
            const cmdOptions = command.split(' ')
            const cmd = this.checkCommand(cmdOptions[0])
            const args = cmdOptions.splice(1)
            const ret = await spawnAsync(cmd, args, {
                stdio: 'inherit',
                cwd: process.cwd()
            })

            if(ret !== 0) {
                throw new Error(errMsg)
            }

            return ret
        }

        throw new Error(`命令不存在`)
    }

    // ejs
    async ejsRender(options) {
        return new Promise((resolve1, reject1) => {
            const cwd = process.cwd()
            glob('**', {
                cwd: cwd,
                ignore: options.ignore,
                nodir: true
            }, (err, files) => {
                if(err) {
                    reject1(err)
                }

                Promise.all(files.map(file => {
                    const filePath = path.join(cwd, file)
                    return new Promise((resolve2, reject2) => {
                        ejs.renderFile(filePath, this.projectInfo, {}, (err, result) => {
                            if(err) {
                                reject2(err)
                            }

                            fsExtra.writeFileSync(filePath, result)
                            resolve2(result)
                        })
                    })
                    console.log(filePath)
                })).then(() => {
                    resolve1()
                }).catch(err => {
                    reject1(err)
                })
            })
        })
    }

    // 验证命令
    checkCommand(cmd) {
        if(WHITE_COMMAND.includes(cmd)) {
            return cmd
        }

        throw new Error(`非法命令：${ cmd }`)
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
