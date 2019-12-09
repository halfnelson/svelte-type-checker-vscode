import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	TextDocument,
	Diagnostic,
	Range,
	DiagnosticSeverity
} from 'vscode-languageserver';
import { SourceMapConsumer } from 'source-map';
import { getOrCreateLanguageServiceForDocument } from './LanguageService';
import { URI } from 'vscode-uri';
import * as ts from 'typescript';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

//source map decoders for each text document
let consumers = new Map<TextDocument, { version: number, consumer: SourceMapConsumer }>();



let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			/*	completionProvider: {
					resolveProvider: true
				} */
		}
	};
});

connection.onInitialized(() => {

});

// The content of a document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async change => {
	const { updateDocument } = getOrCreateLanguageServiceForDocument(change.document);
	updateDocument(change.document);

	let diagnostics = await getDiagnostics(change.document);
	connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});




async function getDiagnostics(document: TextDocument): Promise<Diagnostic[]> {

	const { languageService: lang, getSourceMap } = getOrCreateLanguageServiceForDocument(document);

	const documentPath = URI.parse(document.uri).fsPath;
	const svelteTsxPath = documentPath + ".tsx";

	let diagnostics: ts.Diagnostic[] = [
		...lang.getSyntacticDiagnostics(svelteTsxPath),
		...lang.getSuggestionDiagnostics(svelteTsxPath),
	];
	diagnostics.push(...lang.getSemanticDiagnostics(svelteTsxPath));

	let sourceMap = getSourceMap(document);

	let decoder: { version: number, consumer: SourceMapConsumer } | undefined = undefined;
	if (sourceMap) {
		decoder = consumers.get(document);
		if (!decoder || decoder.version != document.version) {
			decoder = { version: document.version, consumer: await new SourceMapConsumer(sourceMap) };
			consumers.set(document, decoder);
		}
	} else {
		console.log("Couldn't get sourcemap for document", documentPath);
	}

	return diagnostics.map(diagnostic => ({
		range: mapDiagnosticLocationToRange(diagnostic, document, decoder && decoder.consumer),
		severity: mapSeverity(diagnostic.category),
		source: 'svelte-type-checker',
		message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
		code: diagnostic.code,
	} as Diagnostic));
}

export function mapSeverity(category: ts.DiagnosticCategory): DiagnosticSeverity {
    switch (category) {
        case ts.DiagnosticCategory.Error:
            return DiagnosticSeverity.Error;
        case ts.DiagnosticCategory.Warning:
            return DiagnosticSeverity.Warning;
        case ts.DiagnosticCategory.Suggestion:
            return DiagnosticSeverity.Hint;
        case ts.DiagnosticCategory.Message:
            return DiagnosticSeverity.Information;
    }

    return DiagnosticSeverity.Error;
}

const emptyRange:Range = { start: { line: 0, character: 0}, end: {line: 0, character: 0} };

function mapDiagnosticLocationToRange(diagnostic: ts.Diagnostic, document: TextDocument, sourceMap?: SourceMapConsumer): Range {
	if (!diagnostic.file) {
		console.log("No diagnostic file, using convertRange")
		return emptyRange;
	}

	if (typeof diagnostic.start != "number") return emptyRange;

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


	if (sourceMap) {
		for (let pos of [start, end]) {
			let res = sourceMap.originalPositionFor({ line: pos.line + 1, column: pos.character + 1 })
			if (res != null) {
				pos.line = (res.line || 1) - 1;
				pos.character = (res.column || 1) - 1;
			}
		}
	}
	return { start, end }
}




/*
async function validateSvelteDocument(svelteDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	let settings = await getDocumentSettings(svelteDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = svelteDocument.getText();
	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text))) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: svelteDocument.positionAt(m.index),
				end: svelteDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: svelteDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: svelteDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: svelteDocument.uri, diagnostics });
}


// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);
*/
/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
