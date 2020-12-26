#! /usr/bin/env node

"use strict"

const importLocal = require('import-local')

if(importLocal(__filename)) {
    require('npmlog')
        .info('cli', '使用的本地的 weilai-cli')
} else {
    require('../lib')(process.argv.slice(2))
}