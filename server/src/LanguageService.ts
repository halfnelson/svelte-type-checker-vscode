import * as ts from 'typescript';
import { DocumentSnapshot } from './DocumentSnapshot';
import { dirname, resolve } from 'path';
import { RawSourceMap } from 'source-map';
import { TextDocument } from 'vscode-languageserver';
import { URI } from 'vscode-uri' 

export interface LanguageServiceContainer {
    languageService: ts.LanguageService;
    updateDocument(document: TextDocument): void;
    getSourceMap(document: TextDocument): RawSourceMap | undefined;
}

const services = new Map<string, LanguageServiceContainer>();

function serviceContainerForDocument(document: TextDocument): LanguageServiceContainer {
    const searchDir = dirname(URI.parse(document.uri).fsPath);
    const tsconfigPath =
        ts.findConfigFile(searchDir, ts.sys.fileExists, 'tsconfig.json') ||
        ts.findConfigFile(searchDir, ts.sys.fileExists, 'jsconfig.json') ||
        '';

    let service: LanguageServiceContainer;
    if (services.has(tsconfigPath)) {
        service = services.get(tsconfigPath)!;
    } else {
        service = createLanguageService(tsconfigPath);
        services.set(tsconfigPath, service);
    }

    return service;
}

export function getOrCreateLanguageServiceForDocument(document: TextDocument): LanguageServiceContainer {
    return serviceContainerForDocument(document) 
}

export function createLanguageService(tsconfigPath: string): LanguageServiceContainer {

    const workspacePath = tsconfigPath ? dirname(tsconfigPath) : '';
    const documents = new Map<string, DocumentSnapshot>();

    let compilerOptions: ts.CompilerOptions = {
        allowNonTsExtensions: true,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        allowJs: true,
    };

    const configJson = tsconfigPath && ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
    let files: string[] = [];
    if (configJson) {
        const parsedConfig = ts.parseJsonConfigFileContent(
            configJson,
            ts.sys,
            workspacePath,
            compilerOptions,
            tsconfigPath,
            undefined,
            [
                { extension: 'html', isMixedContent: true },
                { extension: 'svelte', isMixedContent: false, scriptKind: ts.ScriptKind.TSX },
            ],
        );
        files = parsedConfig.fileNames;
        compilerOptions = { ...compilerOptions, ...parsedConfig.options };
    }

    //we force some options
    let forcedOptions: ts.CompilerOptions = { 
        noEmit: true,
        declaration: false,
        jsx: ts.JsxEmit.Preserve,
        jsxFactory: "h",
        skipLibCheck: true
    }

    compilerOptions = { ...compilerOptions, ...forcedOptions }
    const svelteTsPath = dirname(require.resolve('svelte2tsx'))
    const svelteTsxFiles = ['./svelte-shims.d.ts', './svelte-jsx.d.ts'].map(f => ts.sys.resolvePath(resolve(svelteTsPath, f)));

    const host: ts.LanguageServiceHost = {
        getCompilationSettings: () => compilerOptions,
        getScriptFileNames: () => Array.from(new Set([...files, ...Array.from(documents.keys()), ...svelteTsxFiles].map(useSvelteTsxName))),
        getScriptVersion(fileName: string) {
            const doc = getSvelteSnapshot(fileName);
            return doc ? String(doc.version) : '0';
        },
        getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
           // console.log("get script snapshot", fileName);
            const doc = getSvelteSnapshot(fileName);
            if (doc) {
                return doc;
            }

            return ts.ScriptSnapshot.fromString(this.readFile!(fileName) || '');
        },
        getCurrentDirectory: () => workspacePath,
        getDefaultLibFileName: ts.getDefaultLibFilePath,

        resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
            return moduleNames.map(name => {
                const resolved = ts.resolveModuleName(
                    name,
                    containingFile,
                    compilerOptions,
                    {
                        fileExists,
                        readFile   
                    },
                );

                return resolved.resolvedModule!;
            });
        },

        readFile(path: string, encoding?: string): string | undefined {
            if (path.endsWith(".svelte")) {
                console.log("reading svelte file from language server host", path);
            }
            return ts.sys.readFile(path, encoding);
        },
    };
    let languageService = ts.createLanguageService(host);

    return {
        languageService,
        updateDocument,
        getSourceMap
    };

    function updateDocument(document: TextDocument) {
      //  console.log("update document", document.getFilePath());
        const newSnapshot = DocumentSnapshot.fromDocument(document);
        documents.set(useSvelteTsxName(URI.parse(document.uri).fsPath), newSnapshot);
    }

    function getSourceMap(document: TextDocument): RawSourceMap | undefined {
        let snap = getSvelteSnapshot(URI.parse(document.uri).fsPath+".tsx");
        if (!snap) return;
        return snap.map;
    }

    function getSvelteSnapshot(fileName: string): DocumentSnapshot | undefined {
        const doc = documents.get(fileName);
        if (doc) {
            return doc;
        }

        if (isSvelteTsx(fileName)) {
            const originalName = originalNameFromSvelteTsx(fileName);
            const doc = DocumentSnapshot.fromDocument(
                TextDocument.create(URI.file(originalName).toString(), '', 0, ts.sys.readFile(originalName) || ''))
            documents.set(fileName, doc);
            return doc;
        }
    }

    function isSvelteTsx(fileName: string): boolean {
        return fileName.endsWith('.svelte.tsx');
    }

    function isSvelte(fileName: string): boolean {
        return fileName.endsWith(".svelte");
    }


    function originalNameFromSvelteTsx(filename: string) {
        return filename.substring(0, filename.length -'.tsx'.length)
    }

    function fileExists(filename: string) {
        if (isSvelteTsx(filename)) {
            return ts.sys.fileExists(originalNameFromSvelteTsx(filename))
        }
        return ts.sys.fileExists(filename);
    }

    function readFile(fileName: string) {
    //    console.log("Reading file from module resolve");
        if (!isSvelteTsx) {
            return ts.sys.readFile(fileName)
        } 
        return ts.sys.readFile(originalNameFromSvelteTsx(fileName));
    }

    function useSvelteTsxName(filename: string) {
        if (isSvelte(filename)) {
            return filename+".tsx";
        }
        return filename;
    }
}
