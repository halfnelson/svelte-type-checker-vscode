import * as ts from 'typescript';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import svelte2tsx from 'svelte2tsx'
import { DocumentMapper, IdentityMapper, ConsumerDocumentMapper } from './mapper'

interface Location {
    line: number; 
    column: number;
}

export interface ParseError {
    message: string,
    start: Location,
    end?: Location
}

export interface DocumentSnapshot extends ts.IScriptSnapshot {
    version: number;
    parseError?: ParseError; 
    scriptKind: ts.ScriptKind;
    map: RawSourceMap | undefined;
    getMapper(): Promise<DocumentMapper>;
}

function scriptKindFromExtension(filenameOrUri: string) {
    if (filenameOrUri.endsWith(".tsx")) return ts.ScriptKind.TSX;
    if (filenameOrUri.endsWith(".ts")) return ts.ScriptKind.TS;
    if (filenameOrUri.endsWith(".js")) return ts.ScriptKind.JS;
    if (filenameOrUri.endsWith(".json")) return ts.ScriptKind.JSON;
    if (filenameOrUri.endsWith(".jsx")) return ts.ScriptKind.JSX;
    return ts.ScriptKind.Unknown;
}

export namespace DocumentSnapshot {
    export function create(uri: string, text: string, version: number): DocumentSnapshot {
        let tsxSource = text;
        let tsxMap:RawSourceMap | undefined = undefined;
        let scriptKind = scriptKindFromExtension(uri);
        var parseError = undefined;
        if (uri.endsWith('.svelte')) {
            try {
                let tsx = svelte2tsx(text);
                tsxSource = tsx.code;
                tsxMap = tsx.map;
                scriptKind = ts.ScriptKind.TSX;
                if (tsxMap) {
                    tsxMap.sources = [uri]
                }
            } catch (e) {
                parseError = {
                    message: e.message,
                    start: e.start,
                    end: e.end
                }
                tsxSource = "";
                console.error(`Couldn't convert ${uri} to tsx`, e);
            }
            console.info(`converted ${uri} to tsx`);
        }
              
        const length = tsxSource.length;

        let mapper: Promise<DocumentMapper> | null = null;

        return {
            parseError: parseError,
            map: tsxMap,
            version: version,
            scriptKind: scriptKind, 
            getText: (start, end) => tsxSource.substring(start, end),
            getLength: () => length,
            getChangeRange: () => undefined,
            getMapper: () => {
                if (!tsxMap) return Promise.resolve(new IdentityMapper());
                return mapper || (mapper = Promise.resolve(new ConsumerDocumentMapper(new SourceMapConsumer(tsxMap), uri)))
            }
        };
    }
}
