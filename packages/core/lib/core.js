'use strict';

const dedent = require("dedent")
const log = require("npmlog")
const yargs = require("yargs/yargs")
const pkg = require("../package.json")

module.exports = core

function core(argv) {
    const cli = yargs(argv)

    const context = {
        weilaiCliVersion: pkg.version,
    }

    return cli
        .usage("Usage: $0 <command> [options]")
        .demandCommand(1, "最少需要输入一个命令。 通过 --help 查看所有可用的命令和选项。")
        .recommendCommands()
        .strict()
        .fail((err, msg) => {
            log.error(err)
        })
        .alias('h', 'help')
        .alias('v', 'version')
        .wrap(cli.terminalWidth())
        .epilogue(
            dedent`
                天道酬勤！加油！
                求内推！
            `
        )
}
