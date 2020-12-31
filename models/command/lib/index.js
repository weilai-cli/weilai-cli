'use strict';

const colors = require('colors')
const semver = require('semver')

const log = require('@weilai-cli/log')
const { isArray } = require('@weilai-cli/utils')

const LOWEST_NODE_VERSION = '10.0.0'

class Command {
    constructor(argv) {
        if(!argv) {
            throw new Error('参数不能为空')
        }

        if(!isArray(argv)) {
            throw new Error('参数必须为数组')
        }

        if(argv.length < 1) {
            throw new Error('参数列表为空')
        }

        this._argv = argv
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve()
            chain = chain.then(() => { this.checkNodeVersion() })
            chain = chain.then(() => { this.initArgs() })
            chain = chain.then(() => { this.init() })
            chain = chain.then(() => { this.exec() })
            chain.catch(err => log.error(err.message))
        })
    }

    init() {
        throw new Error('init 必须实现')
    }

    initArgs() {
        this._cmd = this._argv.pop()
    }

    exec() {
        throw new Error('exec 必须实现')
    }
    

    // 检查 node 的版本
    checkNodeVersion() {
        const currentNodeVersion = process.version
        const lowestNodeVersion = LOWEST_NODE_VERSION
        if(!semver.gte(currentNodeVersion, lowestNodeVersion)) {
            throw new Error(colors.red(`weilai-cli 需要安装 v${lowestNodeVersion} 以上版本的 Node.js`))
        }
    }
}

module.exports = Command;