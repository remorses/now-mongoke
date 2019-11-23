import { build as pythonBuild, } from '@now/python'
import { join, dirname, basename, relative } from 'path'
import {
    getWriteableDirectory,
    download,
    glob,
    createLambda,
    ShouldServeOptions,
    BuildOptions,
    debug,
    FileRef,
    FileFsRef
} from '@now/build-utils'
import execa from 'execa'
import { pretty } from './support'

const MONGOKE_GENERATED_CODE_PATH = '_mongoke'

const generateMongokeFiles = async (
    mongokeConfigPath,
    workDir: string,
    generatedMongokePath
) => {
    debug('generating mongoke code')
    const args = [
        '-m',
        'mongoke',
        mongokeConfigPath,
        '--generated-path',
        generatedMongokePath
    ]
    debug(`executing ${'python ' + args.join(' ')}`)
    await execa('python', args, {
        cwd: workDir,
        stdio: 'pipe'
    })
    return relative(workDir, join(generatedMongokePath, 'main.py'))
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
    originalFiles[newEntrypoint] = new FileFsRef({
        fsPath: join(workPath, newEntrypoint)
    })
    return await pythonBuild({
        workPath,
        files: originalFiles,
        entrypoint: newEntrypoint,
        meta,
        config
    })
}

export const shouldServe = (options: ShouldServeOptions) => {
    debug('printing options for shouldServe')
    pretty(options)
    return true
}