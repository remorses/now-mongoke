import { build as pythonBuild,  } from '@now/python'
import { join, dirname, basename, relative } from 'path'
import fs from 'fs'
import { promisify } from 'util'
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
import {
    getWriteableDirectory,
    download,
    glob,
    shouldServe as pythonShouldServe,
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

const replaceVariableInFile = async (path, variable, replacement) => {
    const originalNowHandlerPyContents = await readFile(path, 'utf8')

    const nowHandlerPyContents = originalNowHandlerPyContents.replace(
        variable,
        replacement
    )
    await writeFile(path, nowHandlerPyContents)
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
    const mongokeDirPath = join(workPath, dirname(entrypoint), MONGOKE_GENERATED_CODE_PATH)
    const newEntrypoint = await generateMongokeFiles(
        entrypoint,
        workPath,
        mongokeDirPath
    )
    debug('new entrypoint is ' + newEntrypoint)
    await replaceVariableInFile(
        join(__dirname, 'now_init.py'),
        '__MONGOKE_PARENT_DIR',
        relative(workPath, dirname(mongokeDirPath))
    )
    // originalFiles[newEntrypoint] = new FileFsRef({
    //     fsPath: join(workPath, newEntrypoint)
    // })
    // meta.isDev = false
    return await pythonBuild({
        workPath,
        files: await glob('**', workPath),
        entrypoint: newEntrypoint,
        meta,
        config
    })
}

export const shouldServe = (options: ShouldServeOptions) => {
    debug('printing options for shouldServe')
    return pythonShouldServe(options)
}

export const version = 3
