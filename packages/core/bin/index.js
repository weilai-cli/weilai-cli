#! /usr/bin/env node

"use strict"

const importLocal = require('import-local')

if(importLocal(__filename)) {
    require('npmlog')
        .info('cli', 'using local version of weilai-cli')
} else {
    require('../lib/core')(process.argv.slice(2))
}