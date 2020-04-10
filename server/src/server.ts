import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	TextDocument,
	Diagnostic,
	Range,
	DiagnosticSeverity,
	TextDocumentPositionParams,
	CompletionItem,
	CompletionItemKind,
	DidChangeWorkspaceFoldersNotification,
	TextEdit,
	MarkupContent,
	CodeActionKind,
	Hover,
	DefinitionLink,
	Location
} from 'vscode-languageserver';

import { serviceContainerForUri } from './LanguageService';

import * as ts from 'typescript';
import { ScriptElementKindToCompletionItemKind, uriToFilePath, filePathToUri, emptyRange, mapSpanToOriginalRange, getMapper, offsetToOriginalPosition, useSvelteOriginalName, useSvelteTsxName } from './util';
import { DocumentContext } from './DocumentContext';


// The settings interface describe the server relevant settings part
interface Settings {
    "svelte-type-checker": TypeCheckerSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface TypeCheckerSettings {
	enableHoverHints: boolean,
	enableDefinitions: boolean,
	enableCompletion: boolean
}


// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

var settings: TypeCheckerSettings = {
	enableHoverHints: false,
	enableDefinitions: false,
	enableCompletion: false
} 

// Create a simple text document manager. The text document manager
// supports full document sync only
export let documents: TextDocuments = new TextDocuments();
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onDidChangeConfiguration((change) => { 
	settings = { ...settings, ...change.settings['svelte-type-checker'] }
	console.log("got new settings", settings);
})

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
			},
			hoverProvider: true,
			definitionProvider: true
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

	const { languageService: lang, getSnapshot } = serviceContainerForUri(document.uri);

	var snap = getSnapshot(document.uri);
	if (snap && snap.parseError) {
		console.log("Parse error, suppressing diagnostics", snap.parseError)
		return [];
	}

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
		console.log("No diagnostic file, using emptyRange", diagnostic)
		return emptyRange;
	}

	let mapper = await getMapper(filePathToUri(diagnostic.file.fileName));
	return mapSpanToOriginalRange(mapper, diagnostic.file, diagnostic.start, diagnostic.length)
}


connection.onHover(async (evt) => {

	if (!settings.enableHoverHints) return null;

	let { textDocument, position } = evt;

	let docContext = await DocumentContext.createFromUri(textDocument.uri);
	if (!docContext || docContext.snapshot.parseError) {
		return null;
	};

	let offset = docContext.generatedOffsetFromOriginalPosition(position);
	if (offset === undefined) {
		console.log("couldn't determine generated position for", textDocument.uri, position);
		return null;
	}

	var info = docContext.languageService.getQuickInfoAtPosition(docContext.generatedFilePath, offset);

	if (!info) {
		return null;
	}

	let contents = ts.displayPartsToString(info.displayParts);
	let h: Hover = {
		range: docContext.originalRangeFromGeneratedSpan(info.textSpan),
		contents: {
			language: "ts",
			value: contents
		}
	}

	return h;
})

connection.onDefinition(async (evt) => {

	if (!settings.enableDefinitions) return null;

	let { position, textDocument } = evt;

	let docContext = await DocumentContext.createFromUri(textDocument.uri);
	if (docContext === undefined) {
		console.log("Couldn't find document context for ", textDocument.uri);
		return null;
	}

	if (docContext.snapshot.parseError) {
		console.log("Skipping definition lookup due to parse error")
		return null;
	}

	let offset = docContext.generatedOffsetFromOriginalPosition(position);
	if (offset === undefined) {
		console.log("Couldn't find offset for document and position", textDocument, position);
		return null;
	}

	const defs = docContext.languageService.getDefinitionAndBoundSpan(docContext.generatedFilePath, offset);
	if (!defs || !defs.definitions) {
		return null;
	}

	let defProms:Promise<Location | null>[] = defs.definitions
	.map(async def => {
		console.log("definition in ", def.fileName)
		var docContext = await DocumentContext.createFromUri(useSvelteOriginalName(filePathToUri(def.fileName)));
		if (!docContext) return null;
		let range = docContext.originalRangeFromGeneratedSpan(def.textSpan);
		
		//trying to find the definition of svelte component looks for the class definition which doesn't exist in the original, we map to 0,1
		if (range.start.line < 0) {
			range.start.line = 0;
			range.start.character = 1;
		}

		if (range.end.line < 0) {
			range.end = range.start;
		}

		return Location.create(
			docContext.uri, 
			range
		);
	});

	let defResults = await Promise.all(defProms);
	return defResults.filter(x => x != null) as Location[];
})


// This handler provides the initial list of the completion items.
connection.onCompletion(
	async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {

		if (!settings.enableCompletion) return [];

		let docContext = await DocumentContext.createFromUri(_textDocumentPosition.textDocument.uri);

		if (docContext === undefined) {
			console.error("couldn't find document for completion", _textDocumentPosition.textDocument.uri);
			return [];
		};

		if (docContext.snapshot.parseError) {
			console.log("skipping completion due to parse error");
			return [];
		}


		let offset = docContext.generatedOffsetFromOriginalPosition(_textDocumentPosition.position);
		if (offset === undefined) {
			console.error("Couldn't determine offset from position", _textDocumentPosition);
			return [];
		}

		let completions = docContext.languageService.getCompletionsAtPosition(docContext.generatedFilePath, offset, {
			includeCompletionsWithInsertText: true,
			includeCompletionsForModuleExports: true
		});

		if (!completions) {
			console.log("Couldn't get completions from offset", offset, "for file", docContext.generatedFilePath);
			return [];
		}

		// The pass parameter contains the position of the text document in
		// which code omplete got requested. For the example we ignore this
		// info and always provide the same completion items.

		return completions.entries.map((c, i) => {
			let textEdit = undefined;
			if (c.replacementSpan) {
				textEdit = TextEdit.replace(docContext!.originalRangeFromGeneratedSpan(c.replacementSpan), c.insertText || c.name);
			}

			let item = {
				label: c.name,
				kind: ScriptElementKindToCompletionItemKind(c.kind),
				sortText: c.sortText + i,
				insertText: c.insertText,
				textEdit: textEdit,
				data: {
					// data used for resolving item details (see 'doResolve')
					uri: docContext!.uri,
					offset,
					source: c.source
				}
			} as CompletionItem
			console.log("Returning item ", item.label, item.insertText, item.kind)
			return item;
		})
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		let { languageService } = serviceContainerForUri(item.data.uri);
		let languageServiceFileName = uriToFilePath(item.data.uri) + ".tsx";
		let details = languageService.getCompletionEntryDetails(languageServiceFileName, item.data.offset, item.label,
			{} as ts.FormatCodeSettings,
			item.data.source, {
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
