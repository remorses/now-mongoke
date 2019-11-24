import { join, dirname, basename } from 'path'
import execa from 'execa'
import fs from 'fs'
import { promisify } from 'util'
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
import {
    getWriteableDirectory,
    download,
    glob,
    createLambda,
    shouldServe,
    BuildOptions,
    debug
} from '@now/build-utils'

export const pretty = (x) => console.log(JSON.stringify(x, null, 4))

export async function pipInstall(
    pipPath: string,
    workDir: string,
    ...args: string[]
) {
    const target = '.'
    // See: https://github.com/pypa/pip/issues/4222#issuecomment-417646535
    //
    // Disable installing to the Python user install directory, which is
    // the default behavior on Debian systems and causes error:
    //
    // distutils.errors.DistutilsOptionError: can't combine user with
    // prefix, exec_prefix/home, or install_(plat)base
    process.env.PIP_USER = '0'
    debug(
        `Running "pip install --disable-pip-version-check --upgrade ${args.join(
            ' '
        )}"...`
    )
    try {
        await execa(
            pipPath,
            [
                'install',
                '--disable-pip-version-check',
                target,
                '--upgrade',
                ...args
            ],
            {
                cwd: workDir,
                env: {
                    // PYTHONPATH: target + ':' + process.env.PYTHONPATH
                }
            }
        )
    } catch (err) {
        console.log(
            `Failed to run "pip install --disable-pip-version-check --target ${target} --upgrade ${args.join(
                ' '
            )}"...`
        )
        throw err
    }
}
