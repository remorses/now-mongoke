import { build as pythonBuild, shouldServe } from '@now/python'
import {
    getWriteableDirectory,
    download,
    glob,
    createLambda,
    // shouldServe,
    BuildOptions,
    debug
} from '@now/build-utils'
import { pretty } from './support'

export const build = async ({
    workPath,
    files: originalFiles,
    entrypoint,
    meta = {},
    config
}: BuildOptions) => {
    pretty({
        workPath,
        files: originalFiles,
        entrypoint,
        meta,
        config
    })
    await pythonBuild({
        workPath,
        files: originalFiles,
        entrypoint,
        meta,
        config
    })
}
