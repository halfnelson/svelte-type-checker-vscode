import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	TextDocument,
	Diagnostic,
	Position,
	Range,
	DiagnosticSeverity,
	TextDocumentPositionParams,
	CompletionItem,
	CompletionItemKind,
	DidChangeWorkspaceFoldersNotification,
	TextEdit
} from 'vscode-languageserver';
import { SourceMapConsumer } from 'source-map';
import { serviceContainerForUri } from './LanguageService';
import { URI } from 'vscode-uri';
import * as ts from 'typescript';
import { ScriptElementKindToCompletionItemKind, uriToFilePath, filePathToUri } from './util';


// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();



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
			completionProvider: {
					resolveProvider: true
			} 
		}
	};
});

connection.onInitialized(() => {

});

// The content of a document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async change => {
	const { updateSnapshot } = serviceContainerForUri(change.document.uri);
	updateSnapshot(change.document.uri, change.document.getText(), change.document.version);

	let diagnostics = await getDiagnostics(change.document);
	connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});



async function getDiagnostics(document: TextDocument): Promise<Diagnostic[]> {

	const { languageService: lang } = serviceContainerForUri(document.uri);

	const documentPath = uriToFilePath(document.uri);
	const svelteTsxPath = documentPath + ".tsx";

	let diagnostics: ts.Diagnostic[] = [
		...lang.getSyntacticDiagnostics(svelteTsxPath),
		...lang.getSuggestionDiagnostics(svelteTsxPath),
	];
	diagnostics.push(...lang.getSemanticDiagnostics(svelteTsxPath));

	return diagnostics.map(diagnostic => ({
		range: mapDiagnosticLocationToRange(diagnostic),
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


async function lineAndCharacterToOriginalPosition(uri: string, pos: ts.LineAndCharacter): Promise<ts.LineAndCharacter | undefined> {
	let { getSnapshot } = serviceContainerForUri(uri);
	let snap = getSnapshot(uri);
	let mapper = await snap.getMapper();
	return mapper.getOriginalPosition(pos);
}



function offsetToOriginalPosition(file: ts.SourceFile, offset: number): Promise<ts.LineAndCharacter | undefined> {
	let fileUri = filePathToUri(file.fileName);
	let pos = file.getLineAndCharacterOfPosition(offset);
	return lineAndCharacterToOriginalPosition(fileUri, pos);
}





async function mapSpanToOriginalRange(file: ts.SourceFile, start: number | undefined, length: number | undefined ): Promise<Range> {
	if (typeof start != "number") return emptyRange;

	
	let startPos = await offsetToOriginalPosition(file, start);
	if (!startPos) return emptyRange;

	let endPos: ts.LineAndCharacter | undefined;
	if (typeof length == "number") {
		endPos =  await offsetToOriginalPosition(file, start + length);
	} 
	endPos = endPos || {
			line: startPos.line,
			character: startPos.character,
	}

	return { start: startPos, end: endPos }
}



async function mapDiagnosticLocationToRange(diagnostic: ts.Diagnostic): Range {
	if (!diagnostic.file) {
		console.log("No diagnostic file, using emptyRange")
		return emptyRange;
	}

	return mapSpanToOriginalRange(diagnostic.file, diagnostic.start, diagnostic.length)

}


// This handler provides the initial list of the completion items.
connection.onCompletion(
		async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
		
		let document = documents.get(_textDocumentPosition.textDocument.uri);

		if (!document) {
			console.error("couldn't find document for completion", _textDocumentPosition.textDocument.uri);
			return [];
		};

		const {languageService, getSourceMap, updateSvelteSnapshot: updateDocument } = getOrCreateLanguageServiceForDocument(document);
//		let snapshot = updateDocument(document);
		let decoder = await getSourceMapConsumer(document);

		let svelteTsxPath = URI.parse(document.uri).fsPath + ".tsx";
		let offset = document.offsetAt(_textDocumentPosition.position);

		if (decoder) {
			let program = languageService.getProgram();
			if (!program) {
				console.log("Couldn't get program for completion for ", document.uri);
				return [];
			}
			let source = program.getSourceFile(svelteTsxPath)!
			if (!source) {
				console.log("Couldn't get source file for ", document.uri);
				return [];
			}

			let pos = decoder.generatedPositionFor({column: _textDocumentPosition.position.character, line: _textDocumentPosition.position.line + 1, source: document.uri });
			offset = source.getPositionOfLineAndCharacter(pos.line - 1, pos.column);
		}

		//updateDocument(document);
		let completions = languageService.getCompletionsAtPosition(svelteTsxPath, offset, {});
		if (!completions) {
			console.log("Couldn't get completions from offset", offset, "for file", svelteTsxPath);
			return [];
		}
		
		// The pass parameter contains the position of the text document in
		// which code omplete got requested. For the example we ignore this
		// info and always provide the same completion items.

	
		
		
		return completions.entries.map( (c, i) => {
			let textEdit = undefined;
			if (c.replacementSpan) {
				textEdit = TextEdit.replace(Range.create(c.replacementSpan.start, c.replacementSpan.start + c.replacementSpan.length), c.insertText || c.name);
			}
			

			return {
				label: c.name,
				kind: ScriptElementKindToCompletionItemKind(c.kind),
				sortText: c.sortText,
				insertText: c.insertText,
				textEdit: c.replacementSpan
			
			} as CompletionItem
		})
		
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

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
