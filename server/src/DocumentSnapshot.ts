import * as ts from 'typescript';
import { RawSourceMap } from 'source-map';
import svelte2tsx from 'svelte2tsx'
import { TextDocument } from 'vscode-languageserver';

export interface DocumentSnapshot extends ts.IScriptSnapshot {
    version: number;
    scriptKind: ts.ScriptKind;
    map: RawSourceMap | undefined;
}

export namespace DocumentSnapshot {
    export function fromDocument(document: TextDocument): DocumentSnapshot {
        const text = document.getText();
        let tsxSource = '';
        let tsxMap = undefined;
        try {
            let tsx = svelte2tsx(text);
            tsxSource = tsx.code;
            tsxMap = tsx.map;
        } catch (e) {
            console.error(`Couldn't convert ${document.uri} to tsx`, e);
        }
        console.info(`converted ${document.uri} to tsx`);
              
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
