import ts from 'typescript';
import {
    DiagnosticsProvider,
    Document,
    Diagnostic,
    OnRegister,
    Host,
    Range
} from '../api';
import {
    convertRange,
    mapSeverity
} from './typescript/utils';
import { getLanguageServiceForDocument, CreateDocument, getSourceMapForDocument } from './ts-svelte/service';
import { pathToUrl } from '../utils';
import { SourceMapConsumer } from 'source-map';



export class TSSveltePlugin
    implements
    DiagnosticsProvider,
    // HoverProvider,
    OnRegister//,
// DocumentSymbolsProvider,
//  CompletionsProvider,
//  DefinitionsProvider,
//  CodeActionsProvider 
{

    public pluginId = 'tssvelte';
    public defaultConfig = {
        enable: true,
        diagnostics: { enable: true },
    };

    private host!: Host;
    private createDocument!: CreateDocument;


    private consumers = new Map<Document, {version: number, consumer: SourceMapConsumer}>();


    onRegister(host: Host) {
        this.host = host;
        this.createDocument = (fileName, content) => {
            const uri = pathToUrl(fileName);
            const document = host.openDocument({
                languageId: '',
                text: content,
                uri,
                version: 0,
            });
            host.lockDocument(uri);
            return document;
        };
    }

    async getDiagnostics(document: Document): Promise<Diagnostic[]> {
        if (!this.host.getConfig<boolean>('tssvelte.diagnostics.enable')) {
            return [];
        }

        const lang = getLanguageServiceForDocument(document, this.createDocument);
        const isTypescript = true;
        const svelteTsxPath =  document.getFilePath()!+".tsx";

        let diagnostics: ts.Diagnostic[] = [
            ...lang.getSyntacticDiagnostics(svelteTsxPath),
            ...lang.getSuggestionDiagnostics(svelteTsxPath),
        ];

        if (isTypescript) {
            diagnostics.push(...lang.getSemanticDiagnostics(svelteTsxPath));
        }

        let sourceMap = getSourceMapForDocument(document);
        let decoder: { version: number, consumer: SourceMapConsumer } | undefined = undefined;
        if (sourceMap) {
            decoder = this.consumers.get(document);
            if (!decoder || decoder.version != document.version) {
                decoder = { version: document.version, consumer: await new SourceMapConsumer(sourceMap)};
                this.consumers.set(document, decoder);
            }
        } else {
            console.log("Couldn't get sourcemap for document", document.getFilePath());
        }

        return diagnostics.map(diagnostic => ({
            range:  decoder != null ? this.mapDiagnosticLocationToRange(diagnostic, document, decoder.consumer) : convertRange(document, diagnostic) ,
            severity: mapSeverity(diagnostic.category),
            source: 'ts-svelte',
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            code: diagnostic.code,
        }));
    }

    mapDiagnosticLocationToRange(diagnostic: ts.Diagnostic, document: Document, consumer: SourceMapConsumer): Range {
        if (!diagnostic.file) {
            console.log("No diagnostic file, using convertRange")
            return convertRange(document, diagnostic)
        }
        if (typeof diagnostic.start != "number") return convertRange(document, diagnostic)

        let start = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
        
        start.character = start.character;
        start.line = start.line;

        let end;
        if (typeof diagnostic.length == "number") {
            end = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start + diagnostic.length);
            end.character = end.character;
            end.line = end.line;
        } else {
            end = {
                line: start.line,
                character: start.character,
            } as ts.LineAndCharacter
        }

       
        for (let pos of [start, end]) {
            let res = consumer.originalPositionFor({ line: pos.line+1, column: pos.character+1 })
            if (res != null) {
                pos.line = (res.line || 1) - 1;
                pos.character = (res.column || 1) - 1;
            }
        }

        return { start, end }
    }

}
