import * as ts from 'typescript';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import svelte2tsx from 'svelte2tsx'
import { DocumentMapper, IdentityMapper, ConsumerDocumentMapper } from './mapper'

export interface DocumentSnapshot extends ts.IScriptSnapshot {
    version: number;
    scriptKind: ts.ScriptKind;
    map: RawSourceMap | undefined;
    getMapper(): Promise<DocumentMapper>;
}

export namespace DocumentSnapshot {
    export function create(uri: string, text: string, version: number): DocumentSnapshot {
        let tsxSource = '';
        let tsxMap:RawSourceMap | undefined = undefined;
        try {
            let tsx = svelte2tsx(text);
            tsxSource = tsx.code;
            tsxMap = tsx.map;

            if (tsxMap) {
                tsxMap.sources = [uri]
            }

        } catch (e) {
            console.error(`Couldn't convert ${uri} to tsx`, e);
        }
        console.info(`converted ${uri} to tsx`);
              
        const length = tsxSource.length;

        let mapper: Promise<DocumentMapper> | null = null;

        return {
            map: tsxMap,
            version: version,
            scriptKind: ts.ScriptKind.TSX, //  getScriptKindFromAttributes(document.getAttributes()),
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
