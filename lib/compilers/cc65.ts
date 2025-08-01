// Copyright (c) 2022, Compiler Explorer Authors
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import fs from 'node:fs/promises';
import path from 'node:path';
import _ from 'underscore';

import type {CompilationResult, ExecutionOptions} from '../../types/compilation/compilation.interfaces.js';
import type {PreliminaryCompilerInfo} from '../../types/compiler.interfaces.js';
import type {ParseFiltersAndOutputOptions} from '../../types/features/filters.interfaces.js';
import {SelectedLibraryVersion} from '../../types/libraries/libraries.interfaces.js';
import {ArtifactType} from '../../types/tool.interfaces.js';
import {addArtifactToResult} from '../artifact-utils.js';
import {BaseCompiler} from '../base-compiler.js';
import {CompilationEnvironment} from '../compilation-env.js';
import {CC65AsmParser} from '../parsers/asm-parser-cc65.js';
import * as utils from '../utils.js';

export class Cc65Compiler extends BaseCompiler {
    static get key() {
        return 'cc65';
    }

    constructor(compilerInfo: PreliminaryCompilerInfo, env: CompilationEnvironment) {
        super(compilerInfo, env);

        this.asm = new CC65AsmParser(this.compilerProps);
        this.toolchainPath = path.resolve(path.dirname(compilerInfo.exe), '..');
    }

    override getSharedLibraryPathsAsArguments(libraries: SelectedLibraryVersion[], libDownloadPath?: string) {
        const libPathFlag = this.compiler.libpathFlag || '-L';

        if (!libDownloadPath) {
            libDownloadPath = '.';
        }

        return _.union(
            [libPathFlag + libDownloadPath],
            this.compiler.libPath.map(path => libPathFlag + path),
            this.getSharedLibraryPaths(libraries).map(path => libPathFlag + path),
        ) as string[];
    }

    override optionsForFilter(filters: ParseFiltersAndOutputOptions, outputFilename: string) {
        if (filters.binary) {
            return ['-g', '-o', this.filename(outputFilename)];
        }
        return ['-g', '-S', '-c', '-o', this.filename(outputFilename)];
    }

    override getCompilerEnvironmentVariables(compilerflags: string) {
        const allOptions = (this.compiler.options + ' ' + compilerflags).trim();
        return {...this.cmakeBaseEnv, CFLAGS: allOptions};
    }

    override async getCmakeBaseEnv() {
        if (!this.compiler.exe) return {};

        const env: Record<string, string> = {};

        env.CC = this.compiler.exe;

        if (this.toolchainPath) {
            const ldPath = `${this.toolchainPath}/bin/ld65`;
            const arPath = `${this.toolchainPath}/bin/ar65`;
            const asPath = `${this.toolchainPath}/bin/as65`;

            if (await utils.fileExists(ldPath)) env.LD = ldPath;
            if (await utils.fileExists(arPath)) env.AR = arPath;
            if (await utils.fileExists(asPath)) env.AS = asPath;
        }

        return env;
    }

    override async objdump(
        outputFilename: string,
        result: CompilationResult,
        maxSize: number,
        intelAsm: boolean,
        demangle: boolean,
        staticReloc: boolean,
        dynamicReloc: boolean,
        filters: ParseFiltersAndOutputOptions,
    ) {
        const res = await super.objdump(
            outputFilename,
            result,
            maxSize,
            intelAsm,
            demangle,
            staticReloc,
            dynamicReloc,
            filters,
        );

        const dirPath = path.dirname(outputFilename);
        const nesFile = path.join(dirPath, 'example.nes');
        if (await utils.fileExists(nesFile)) {
            await addArtifactToResult(res, nesFile, ArtifactType.nesrom);
        }

        if (result.compilationOptions?.includes('c64') && (await utils.fileExists(outputFilename))) {
            if (outputFilename.endsWith('.prg')) {
                await addArtifactToResult(res, outputFilename, ArtifactType.c64prg);
            } else {
                await addArtifactToResult(
                    res,
                    outputFilename,
                    ArtifactType.c64prg,
                    path.basename(outputFilename) + '.prg',
                );
            }
        }

        return res;
    }

    override async doBuildstepAndAddToResult(
        result: CompilationResult,
        name: string,
        command: string,
        args: string[],
        execParams: ExecutionOptions,
    ) {
        const stepResult = await super.doBuildstepAndAddToResult(result, name, command, args, execParams);
        if (name === 'build') {
            const mapFile = path.join(execParams.customCwd!, 'map.txt');
            if (await utils.fileExists(mapFile)) {
                const file_buffer = await fs.readFile(mapFile);
                stepResult.stderr = stepResult.stderr.concat(utils.parseOutput(file_buffer.toString()));
            }
        }
        return stepResult;
    }
}
