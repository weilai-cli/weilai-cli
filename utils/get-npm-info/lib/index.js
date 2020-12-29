'use strict';

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersions,
    getDefaultRegistry,
    getNpmLatestVersion
}

async function getNpmLatestVersion (npmName, registry) {
    const versions = await getNpmVersions(npmName, registry)
    return versions 
        ? versions.sort((a, b) => semver.gt(b, a))[0]
        : null
}

async function getNpmSemverVersions(npmName, baseVersion, registry = false) {
    const versions = await getNpmVersions(npmName, registry)
    const newVersions = getSemverVersions(baseVersion, versions)
    return newVersions 
        && newVersions.length > 0 
        && newVersions[0]
}

function getSemverVersions(baseVersion, version) {
    return version
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
        .sort((a, b) => semver.gt(b, a))
}

async function getNpmVersions(npmName, registry) {
    const res = await getNpmInfo(npmName, registry)
    if(res) {
        return Object.keys(res.versions)
    }

    return []
}

function getNpmInfo(npmName, registry) {
    if(!npmName) return null
    const registryUrl = registry || getDefaultRegistry()
    const npmInfoUrl = urlJoin(registryUrl, npmName)
    return axios
        .get(npmInfoUrl)
        .then(response => {
            if(response.status === 200) {
                return response.data
            }

            return null
        })
        .catch(err => {
            return Promise.reject(err)
        })
}

function getDefaultRegistry(isOriginal = false) {
    return isOriginal
        ? 'https://registry.npmjs.org/'
        : 'https://registry.npm.taobao.org/'
}
