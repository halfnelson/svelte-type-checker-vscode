import ts from 'typescript';
import { Document } from '../../api';
import { RawSourceMap } from 'source-map';
import { svelte2tsx } from 'ts-svelte'

export interface DocumentSnapshot extends ts.IScriptSnapshot {
    version: number;
    scriptKind: ts.ScriptKind;
    map: RawSourceMap | undefined;
}

export namespace DocumentSnapshot {
    export function fromDocument(document: Document): DocumentSnapshot {
        const text = document.getText();
        let tsxSource = '';
        let tsxMap = undefined;
        try {
            let tsx = svelte2tsx(text);
            tsxSource = tsx.code;
            tsxMap = tsx.map;
        } catch (e) {
            console.error("Couldn't convert to tsx", e);
        }
        console.info(`converted ${document.getFilePath()} to tsx`);
              
        const length = tsxSource.length;

        return {
            map: tsxMap,
            version: document.version,
            scriptKind: ts.ScriptKind.TSX, //  getScriptKindFromAttributes(document.getAttributes()),
            getText: (start, end) => tsxSource.substring(start, end),
            getLength: () => length,
            getChangeRange: () => undefined,
        };
    }
}
