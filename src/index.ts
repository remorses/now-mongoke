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

const MONGOKE_GENERATED_CODE_PATH = 'generated_mongoke'

const generateMongokeFiles = async (
    mongokeConfigPath,
    workDir: string,
    generatedMongokePath
) => {
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
        join(workPath, MONGOKE_GENERATED_CODE_PATH)
    )
    return await pythonBuild({
        workPath,
        files: originalFiles,
        entrypoint: newEntrypoint,
        meta,
        config
    })
}
