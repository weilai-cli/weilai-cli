const request = require('@weilai-cli/request')

module.exports = function () {
    return request({
        url: '/project/template'
    })
}