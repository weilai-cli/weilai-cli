'use strict';

const path = require('path')
const pkgDir = require('pkg-dir')

const { isObject } = require('@weilai-cli/utils')
const formatPath = require('@weilai-cli/format-path')

class Package {
    constructor(options) {
        if(!options) throw new Error('Package 类的 options 参数不能为空')
        if(!isObject(options)) throw new Error('Package 类的 options 参数必须是对象')

        // 路径
        this.targetPath = options.targetPath
        // // 存储路径
        // this.storePath = options.storePath
        // 名称
        this.packageName = options.packageName
        // 版本号
        this.packageVersion = options.packageVersion
    }

    // 判断当前 package 是否存在
    exists() {
        
    }

    // 安装 package
    install() {

    }

    // 更新 package
    update() {

    }

    // 获取入口文件
    getRootFile() {
        // 1. 获取 package.json 所在的目录
        const dir = pkgDir.sync(this.targetPath)
        if(dir) {
            // 2. 读取 package.json
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 3. 寻找 main / bin
            if(pkgFile && pkgFile.main) {
                // 4. 路径的兼容
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}

module.exports = Package;
