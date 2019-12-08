import ts from 'typescript';
import { DocumentSnapshot } from './DocumentSnapshot';
import { isSvelte } from '../typescript/utils';
import { dirname, resolve } from 'path';
import { Document } from '../../api';
import { RawSourceMap } from 'source-map';


export interface LanguageServiceContainer {
    updateDocument(document: Document): ts.LanguageService;
    getSourceMap(document: Document): RawSourceMap | undefined;
}

const services = new Map<string, LanguageServiceContainer>();

export type CreateDocument = (fileName: string, content: string) => Document;

export function getLanguageServiceForDocument(
    document: Document,
    createDocument: CreateDocument,
): ts.LanguageService {
    const searchDir = dirname(document.getFilePath()!);
    const tsconfigPath =
        ts.findConfigFile(searchDir, ts.sys.fileExists, 'tsconfig.json') ||
        ts.findConfigFile(searchDir, ts.sys.fileExists, 'jsconfig.json') ||
        '';

    let service: LanguageServiceContainer;
    if (services.has(tsconfigPath)) {
        service = services.get(tsconfigPath)!;
    } else {
        service = createLanguageService(tsconfigPath, createDocument);
        services.set(tsconfigPath, service);
    }

    return service.updateDocument(document);
}

export function getSourceMapForDocument(
    document: Document
): RawSourceMap | undefined {
    const searchDir = dirname(document.getFilePath()!);
    const tsconfigPath =
        ts.findConfigFile(searchDir, ts.sys.fileExists, 'tsconfig.json') ||
        ts.findConfigFile(searchDir, ts.sys.fileExists, 'jsconfig.json') ||
        '';

    let service: LanguageServiceContainer;
    if (services.has(tsconfigPath)) {
        service = services.get(tsconfigPath)!;
    }  else {
        return undefined;
    }

    return service.getSourceMap(document);
}

export function createLanguageService(
    tsconfigPath: string,
    createDocument: CreateDocument,
): LanguageServiceContainer {
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
    const svelteTsPath = dirname(require.resolve('ts-svelte'))
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
        updateDocument,
        getSourceMap
    };

    function updateDocument(document: Document): ts.LanguageService {
      //  console.log("update document", document.getFilePath());
        const newSnapshot = DocumentSnapshot.fromDocument(document);
        documents.set(useSvelteTsxName(document.getFilePath()!), newSnapshot);
        return languageService;
    }

    function getSourceMap(document: Document): RawSourceMap | undefined {
        let snap = getSvelteSnapshot(document.getFilePath()!+".tsx");
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
                createDocument(originalName, ts.sys.readFile(originalName) || ''))
            documents.set(fileName, doc);
            return doc;
        }
    }

    function isSvelteTsx(fileName: string): boolean {
        return fileName.endsWith('.svelte.tsx');
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
