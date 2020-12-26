'use strict';

const log = require('npmlog')

// 判断 debug 模式
log.level = process.env.LOG_LEVEL
    ? process.env.LOG_LEVEL
    : 'info'

log.heading = 'weilai-cli' // 修改前缀
// log.headingStyle = { fg: 'gren', bg: 'black' } } // 修改前缀样式
log.addLevel('success', 2000, { fg: 'gren', bold: true } ) // 添加自定义的样式

module.exports = log
