import * as ts from 'typescript';
import { DocumentSnapshot } from './DocumentSnapshot';
import { dirname, resolve } from 'path';
import { uriToFilePath, filePathToUri } from './util';



export interface LanguageServiceContainer {
    languageService: ts.LanguageService;
    updateSnapshot(uri: string, content: string, version: number): DocumentSnapshot;
    getSnapshot(uri: string): DocumentSnapshot;
}

const services = new Map<string, LanguageServiceContainer>();

export function serviceContainerForUri(documentUri: string): LanguageServiceContainer {
    const searchDir = dirname(uriToFilePath(documentUri));
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
        getScriptFileNames: () => Array.from(new Set([...files, ...Array.from(documents.keys()).map(k => uriToFilePath(k) || k) , ...svelteTsxFiles].map(useSvelteTsxName))),
        getScriptVersion(fileName: string) {
            const doc = getSnapshot(filePathToUri(fileName));
            return String(doc.version)
        },
        getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
           // console.log("get script snapshot", fileName);
            return getSnapshot(filePathToUri(fileName));
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
        updateSnapshot,
        getSnapshot,
    };

    function updateSnapshot(uri: string, content: string, version: number) {
      //  console.log("update document", document.getFilePath());
        let snap = getSnapshot(uri);
        if (snap && snap.version == version) return snap;

        const newSnapshot = DocumentSnapshot.create(uri, content, version);
        documents.set(uri, newSnapshot);
        return newSnapshot;
    }

    function getSnapshot(uri: string): DocumentSnapshot {
        const originalName = useSvelteOriginalName(uri);
        const doc = documents.get(originalName);
        if (doc) {
            return doc;
        }

        if (isSvelteTsx(uri)) {
            const doc = DocumentSnapshot.create(originalName, readFile(uriToFilePath(originalName)) || '', 0)
            documents.set(originalName, doc);
            return doc;
        }

        return DocumentSnapshot.create(uri,  ts.sys.readFile(uriToFilePath(uri)) || '', 0);
    }

    function isSvelteTsx(fileNameOrUri: string): boolean {
        return fileNameOrUri.endsWith('.svelte.tsx');
    }

    function isSvelte(fileNameOrUri: string): boolean {
        return fileNameOrUri.endsWith(".svelte");
    }


    function originalNameFromSvelteTsx(fileNameOrUri: string) {
        return fileNameOrUri.substring(0, fileNameOrUri.length -'.tsx'.length)
    }

    function fileExists(filename: string) {
        if (isSvelteTsx(filename)) {
            return ts.sys.fileExists(originalNameFromSvelteTsx(filename))
        }
        return ts.sys.fileExists(filename);
    }

    function readFile(fileName: string) {
        if (!isSvelteTsx(fileName)) {
            return ts.sys.readFile(fileName)
        } 
        return ts.sys.readFile(originalNameFromSvelteTsx(fileName));
    }

    function useSvelteTsxName(fileNameOrUri: string) {
        if (isSvelte(fileNameOrUri)) {
            return fileNameOrUri+".tsx";
        }
        return fileNameOrUri;
    }

    function useSvelteOriginalName(fileNameOrUri: string) {
        if (isSvelteTsx(fileNameOrUri)) {
            return originalNameFromSvelteTsx(fileNameOrUri)
        }
        return fileNameOrUri;
    }
}
