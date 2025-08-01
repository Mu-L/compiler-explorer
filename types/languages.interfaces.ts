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

export type LanguageKey =
    | 'ada'
    | 'algol68'
    | 'analysis'
    | 'android-java'
    | 'android-kotlin'
    | 'assembly'
    | 'c'
    | 'c++'
    | 'c3'
    | 'carbon'
    | 'circle'
    | 'circt'
    | 'clean'
    | 'cmake'
    | 'cmakescript'
    | 'cobol'
    | 'coccinelle_for_c'
    | 'coccinelle_for_cpp'
    | 'cpp_for_opencl'
    | 'cppx'
    | 'snowball'
    | 'cppx_blue'
    | 'cppx_gold'
    | 'cpp2_cppfront'
    | 'crystal'
    | 'csharp'
    | 'cuda'
    | 'd'
    | 'dart'
    | 'elixir'
    | 'erlang'
    | 'fortran'
    | 'fsharp'
    | 'gimple'
    | 'glsl'
    | 'go'
    | 'haskell'
    | 'hlsl'
    | 'hook'
    | 'hylo'
    | 'ispc'
    | 'il'
    | 'jakt'
    | 'java'
    | 'julia'
    | 'javascript'
    | 'kotlin'
    | 'llvm'
    | 'llvm_mir'
    | 'mlir'
    | 'modula2'
    | 'mojo'
    | 'nim'
    | 'nix'
    | 'numba'
    | 'ocaml'
    | 'odin'
    | 'objc'
    | 'objc++'
    | 'openclc'
    | 'pascal'
    | 'pony'
    | 'python'
    | 'ptx'
    | 'racket'
    | 'raku'
    | 'ruby'
    | 'rust'
    | 'sail'
    | 'scala'
    | 'slang'
    | 'solidity'
    | 'spice'
    | 'spirv'
    | 'sway'
    | 'swift'
    | 'tablegen'
    | 'toit'
    | 'triton'
    | 'typescript'
    | 'v'
    | 'vala'
    | 'vb'
    | 'vyper'
    | 'wasm'
    | 'zig'
    | 'ylc';

export interface Language {
    /** Id of language. Added programmatically based on CELanguages key */
    id: LanguageKey;
    /** UI display name of the language */
    name: string;
    /** Monaco Editor language ID (Selects which language Monaco will use to highlight the code) */
    monaco: string;
    /** Usual extensions associated with the language. First one is used as file input extension */
    extensions: [string, ...string[]];
    /** Different ways in which we can also refer to this language */
    alias: string[];
    /** Format API name to use (See https://godbolt.org/api/formats) */
    formatter: string | null;
    /** Whether there's at least 1 compiler in this language that supportsExecute */
    supportsExecute: boolean | null;
    /** Path in /public/logos to the logo of the language */
    logoFilename: string | null;
    /** Path in /public/logos to the logo of the language for dark mode use */
    logoFilenameDark: string | null;
    /** Example code to show in the language's editor */
    example: string;
    previewFilter: RegExp | null;
    /** The override for the output (default is "asm") */
    monacoDisassembly: string | null;
    /** Brief description of the language */
    tooltip?: string;
    /** Default compiler for the language. This is populated when handed to the frontend. */
    defaultCompiler?: string;
    digitSeparator?: string;
}
