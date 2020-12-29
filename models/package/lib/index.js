'use strict';

const path = require('path')

const pkgDir = require('pkg-dir')
const fsExtra = require('fs-extra')
const npminstall = require('npminstall')
const pathExists = require('path-exists')

const { isObject } = require('@weilai-cli/utils')
const formatPath = require('@weilai-cli/format-path')
const { 
    getDefaultRegistry,
    getNpmLatestVersion
} = require('@weilai-cli/get-npm-info')

class Package {
    constructor(options) {
        if(!options) throw new Error('Package 类的 options 参数不能为空')
        if(!isObject(options)) throw new Error('Package 类的 options 参数必须是对象')

        // 路径
        this.targetPath = options.targetPath
        // 存储路径
        this.storePath = options.storePath
        // 名称
        this.packageName = options.packageName
        // 版本号
        this.packageVersion = options.packageVersion
        // 缓存目录的前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare() {
        if(this.storePath && !pathExists.sync(this.storePath)) {
            fsExtra.mkdirpSync(this.storePath)
        }

        if(this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageVersion)
        }
    }

    // 获取缓存文件的路径
    get cacheFilePath() {
        return path.resolve(
            this.storePath, 
            `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
        )
    }

    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(
            this.storePath, 
            `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
        )
    }

    // 判断当前 package 是否存在
    async exists() {
        if(this.storePath) {
            await this.prepare()
            console.log('cacheFilePath', this.cacheFilePath)
            return pathExists.sync(this.cacheFilePath)
        } else {
            return pathExists.sync(this.targetPath)
        }
    }

    // 安装 package
    install() {
        npminstall({
            root: this.targetPath,
            storeDir: this.storePath,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName, 
                version: this.packageVersion 
            }]
        })
    }

    // 更新 package
    async update() {
        await this.prepare()
        // 1. 获取最新的 npm 模块的版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName)
        // 2. 查询最新版本号对应的路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
        // 3. 如果不存在，则直接安装最新版本
        if(!pathExists.sync(latestFilePath)) {
            npminstall({
                root: this.targetPath,
                storeDir: this.storePath,
                registry: getDefaultRegistry(),
                pkgs: [{
                    name: this.packageName, 
                    version: latestPackageVersion
                }]
            })
            this.packageVersion = latestPackageVersion
        }
    }

    // 获取入口文件
    getRootFile() {
        function _getRootFile(targetPath) {
            // 1. 获取 package.json 所在的目录
            const dir = pkgDir.sync(targetPath)
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

        return this.storePath
            ? _getRootFile(this.storePath)
            : _getRootFile(this.targetPath)
    }
}

module.exports = Package;
