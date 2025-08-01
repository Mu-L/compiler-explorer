// Copyright (c) 2021, Compiler Explorer Authors
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
import {describe, expect, it} from 'vitest';

import {ClangCompiler} from '../../lib/compilers/index.js';
import {makeCompilationEnvironment} from '../utils.js';

describe('clang tests', () => {
    const languages = {'c++': {id: 'c++'}};
    const info = {
        exe: 'foobar',
        remote: true,
        lang: 'c++',
        ldPath: [],
    };
    const clang = new ClangCompiler(info as any, makeCompilationEnvironment({languages}));

    it('Should return null for non-device code', async () => {
        expect(await clang.splitDeviceCode('')).to.be.null;
        expect(await clang.splitDeviceCode('mov eax, 00h\nadd r0, r0, #1\n')).to.be.null;
    });

    it('should separate out bundles ', async () => {
        expect(
            await clang.splitDeviceCode(`# __CLANG_OFFLOAD_BUNDLE____START__ openmp-x86_64-unknown-linux-gnu
    i am some
    linux remote stuff
# __CLANG_OFFLOAD_BUNDLE____END__ openmp-x86_64-unknown-linux-gnu

# __CLANG_OFFLOAD_BUNDLE____START__ host-x86_64-unknown-linux-gnu
    whereas
    i am host code
# __CLANG_OFFLOAD_BUNDLE____END__ host-x86_64-unknown-linux-gnu
`),
        ).to.deep.equal({
            'host-x86_64-unknown-linux-gnu': '    whereas\n    i am host code\n',
            'openmp-x86_64-unknown-linux-gnu': '    i am some\n    linux remote stuff\n',
        });
    });

    it('should run process llvm opt output', async () => {
        const test = `--- !Missed
Pass: inline
Name: NeverInline
DebugLoc: { File: example.cpp, Line: 4, Column: 21 }
Function: main
Args: []
...
`;
        const dirPath = await clang.newTempDir();
        const optPath = path.join(dirPath, 'temp.out');
        await fs.writeFile(optPath, test);
        const dummyCompilationResult = {optPath: optPath, code: 0, stdout: [], stderr: [], timedOut: false};
        expect(await clang.processOptOutput(dummyCompilationResult)).toEqual([
            {
                Args: [],
                DebugLoc: {Column: 21, File: 'example.cpp', Line: 4},
                Function: 'main',
                Name: 'NeverInline',
                Pass: 'inline',
                displayString: '',
                optType: 'Missed',
            },
        ]);
    });

    it('should process raw opt remarks', async () => {
        const doc = `--- !Analysis
Pass:            prologepilog
Name:            StackSize
DebugLoc:        { File: example.cpp, Line: 2, Column: 0 }
Function:        _Z6squarei
Args:
  - NumStackBytes:   '8'
  - String:          ' stack bytes in function'
...
--- !Analysis
Pass:            asm-printer
Name:            InstructionCount
DebugLoc:        { File: example.cpp, Line: 2, Column: 0 }
Function:        _Z6squarei
Args:
  - NumInstructions: '7'
  - String:          ' instructions in function'
...
`;
        const output: object[] = clang.processRawOptRemarks(doc);
        expect(output).toEqual([
            {
                Args: [
                    {
                        NumStackBytes: '8',
                    },
                    {
                        String: ' stack bytes in function',
                    },
                ],
                DebugLoc: {
                    Column: 0,
                    File: 'example.cpp',
                    Line: 2,
                },
                Function: '_Z6squarei',
                Name: 'StackSize',
                Pass: 'prologepilog',
                displayString: '8 stack bytes in function',
                optType: 'Analysis',
            },
            {
                Args: [
                    {
                        NumInstructions: '7',
                    },
                    {
                        String: ' instructions in function',
                    },
                ],
                DebugLoc: {
                    Column: 0,
                    File: 'example.cpp',
                    Line: 2,
                },
                Function: '_Z6squarei',
                Name: 'InstructionCount',
                Pass: 'asm-printer',
                displayString: '7 instructions in function',
                optType: 'Analysis',
            },
        ]);
    });
});
