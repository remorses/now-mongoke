import { build as pythonBuild, shouldServe } from '@now/python'
import { join, dirname, basename } from 'path'
import {
    getWriteableDirectory,
    download,
    glob,
    createLambda,
    // shouldServe,
    BuildOptions,
    debug
} from '@now/build-utils'
import execa from 'execa'
import { pretty } from './support'

const MONGOKE_GENERATED_CODE_PATH = '.mongoke'

const generateMongokeFiles = async (
    mongokeConfigPath,
    workDir: string,
    generatedMongokePath
) => {
    debug('generating mongoke code')
    await execa(
        'python',
        [
            '-m',
            'mongoke',
            mongokeConfigPath,
            '--generated-path',
            generatedMongokePath
        ],
        {
            cwd: workDir,
            stdio: 'pipe'
        }
    )
    return join(generatedMongokePath, 'main.py')
}

export const build = async ({
    workPath,
    files: originalFiles,
    entrypoint,
    meta = {},
    config
}: BuildOptions) => {
    // let downloadedFiles = await download(originalFiles, workPath, meta)
    pretty({
        workPath,
        files: originalFiles,
        entrypoint,
        meta,
        config
    })
    const newEntrypoint = await generateMongokeFiles(
        entrypoint,
        workPath,
        join(workPath, dirname(entrypoint), MONGOKE_GENERATED_CODE_PATH)
    )
    debug('new entrypoint is ' + newEntrypoint)
    return await pythonBuild({
        workPath,
        files: originalFiles,
        entrypoint: newEntrypoint,
        meta,
        config
    })
}
