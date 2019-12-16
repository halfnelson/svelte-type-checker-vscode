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
	TextEdit,
	MarkupContent
} from 'vscode-languageserver';
import { SourceMapConsumer } from 'source-map';
import { serviceContainerForUri } from './LanguageService';
import { URI } from 'vscode-uri';
import * as ts from 'typescript';
import { ScriptElementKindToCompletionItemKind, uriToFilePath, filePathToUri, emptyRange, mapSpanToOriginalRange, getMapper, offsetToOriginalPosition } from './util';


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

	return Promise.all(diagnostics.map(async diagnostic => ({
		range: await mapDiagnosticLocationToRange(diagnostic),
		severity: mapSeverity(diagnostic.category),
		source: 'svelte-type-checker',
		message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
		code: diagnostic.code,
	} as Diagnostic)));
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


async function mapDiagnosticLocationToRange(diagnostic: ts.Diagnostic): Promise<Range> {
	if (!diagnostic.file) {
		console.log("No diagnostic file, using emptyRange")
		return emptyRange;
	}

	let mapper = await getMapper(uriToFilePath(diagnostic.file.fileName));
	return mapSpanToOriginalRange(mapper, diagnostic.file, diagnostic.start, diagnostic.length)
}


// This handler provides the initial list of the completion items.
connection.onCompletion(
		async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
		
		let document = documents.get(_textDocumentPosition.textDocument.uri)!;

		if (!document) {
			console.error("couldn't find document for completion", _textDocumentPosition.textDocument.uri);
			return [];
		};

		let  { languageService } = serviceContainerForUri(document.uri);
		let mapper = await getMapper(_textDocumentPosition.textDocument.uri);
		let offset = document.offsetAt(_textDocumentPosition.position);


		let languageServiceFileName = uriToFilePath(document.uri) + ".tsx";
		let program = languageService.getProgram();
		if (!program) {
			console.log("Couldn't get program for completion for ", document.uri);
			return [];
		}
		let source = program.getSourceFile(languageServiceFileName)!
		if (!source) {
			console.log("Couldn't get source file for ", document.uri+".tsx");
			return [];
		}

		let pos = mapper.getGeneratedPosition(_textDocumentPosition.position);
		if (!pos) {
			console.log("couldn't determine generated position for", document.uri, pos);
			return [];
		}

		offset = source.getPositionOfLineAndCharacter(pos.line, pos.character);
	

		//updateDocument(document);
		let completions = languageService.getCompletionsAtPosition(languageServiceFileName, offset, {});
		if (!completions) {
			console.log("Couldn't get completions from offset", offset, "for file", languageServiceFileName);
			return [];
		}
		
		// The pass parameter contains the position of the text document in
		// which code omplete got requested. For the example we ignore this
		// info and always provide the same completion items.
		
		return completions.entries.map( (c, i) => {
			let textEdit = undefined;
			if (c.replacementSpan) {
				let start = offsetToOriginalPosition(mapper, source, c.replacementSpan.start);
				let end = offsetToOriginalPosition(mapper, source, c.replacementSpan.start + c.replacementSpan.length);
				if (start && end) {
					textEdit = TextEdit.replace(Range.create(start, end), c.insertText || c.name);
				}
			}
			

			return {
				label: c.name,
				kind: ScriptElementKindToCompletionItemKind(c.kind),
				sortText: c.sortText,
				insertText: c.insertText,
				textEdit: textEdit,
				data: {
					// data used for resolving item details (see 'doResolve')
					uri: document.uri,
					offset,
					source: c.source
				}
			} as CompletionItem
		})
	}		
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		let { languageService } = serviceContainerForUri(item.data.uri);
		let languageServiceFileName = uriToFilePath(item.data.uri) + ".tsx";
		let details = languageService.getCompletionEntryDetails(languageServiceFileName, item.data.offset, item.label, undefined,  item.data.source, {
			importModuleSpecifierEnding: 'minimal',
			importModuleSpecifierPreference: 'relative',
			includeCompletionsWithInsertText: true
		})
		if (details && item.kind !== CompletionItemKind.File && item.kind !== CompletionItemKind.Folder) {
			item.detail = ts.displayPartsToString(details.displayParts);
			const documentation: MarkupContent = {
			  kind: 'markdown',
			  value: ts.displayPartsToString(details.documentation)
			};
			/*
			if (details.codeActions) {
			  const textEdits = convertCodeAction(doc, details.codeActions, firstScriptRegion);
			  item.additionalTextEdits = textEdits;
	
			  details.codeActions.forEach(action => {
				if (action.description) {
				  documentation.value += '\n' + action.description;
				}
			  });
			}
			*/
			item.documentation = documentation;
			delete item.data;
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
