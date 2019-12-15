import ts = require('typescript');
import { CompletionItemKind, TextDocument, Range } from 'vscode-languageserver';
import { SourceMapConsumer, RawSourceMap } from 'source-map';
import { URI } from 'vscode-uri';

export function uriToFilePath(uri: string): string {
    return URI.parse(uri).fsPath;
}

export function filePathToUri(filePath: string): string {
    return URI.file(filePath).toString();
}


export function ScriptElementKindToCompletionItemKind(kind: ts.ScriptElementKind): CompletionItemKind {
	switch (kind) {
		case ts.ScriptElementKind.primitiveType:
		case ts.ScriptElementKind.keyword:
			return CompletionItemKind.Keyword;
		case ts.ScriptElementKind.variableElement:
		case ts.ScriptElementKind.localVariableElement:
			return CompletionItemKind.Variable;
		case ts.ScriptElementKind.memberVariableElement:
		case ts.ScriptElementKind.memberGetAccessorElement:
		case ts.ScriptElementKind.memberSetAccessorElement:
			return CompletionItemKind.Field;
		case ts.ScriptElementKind.functionElement:
		case ts.ScriptElementKind.memberFunctionElement:
		case ts.ScriptElementKind.constructSignatureElement:
		case ts.ScriptElementKind.callSignatureElement:
		case ts.ScriptElementKind.indexSignatureElement:
			return CompletionItemKind.Function;
		case ts.ScriptElementKind.enumElement:
			return CompletionItemKind.Enum;
		case ts.ScriptElementKind.moduleElement:
			return CompletionItemKind.Module;
		case ts.ScriptElementKind.classElement:
			return CompletionItemKind.Class;
		case ts.ScriptElementKind.interfaceElement:
			return CompletionItemKind.Interface;
		case ts.ScriptElementKind.warning:
		case ts.ScriptElementKind.scriptElement:
			return CompletionItemKind.File;
		case ts.ScriptElementKind.directory:
			return CompletionItemKind.Folder;
		default:
			return CompletionItemKind.Text
	}
}

/*
//source map decoders are cached since they are heavy
//we will see how far a simple Map gets us
let consumers = new Map<RawSourceMap, SourceMapConsumer>();


export function getSourceMap(document: TextDocument): RawSourceMap | undefined {
	const { getSourceMap } = getOrCreateLanguageServiceForDocument(document);
	let sourceMap = getSourceMap(document);
	if (!sourceMap) return;
}




export async function getSourceMapConsumer(sourceMap: RawSourceMap | undefined): Promise<SourceMapConsumer | undefined> {
	let decoder = consumers.get(document);
	if (decoder && decoder.version == document.version) return decoder.consumer;
	
	//create a new consumer
	let sourceMap = getSourceMap(document);
	if (!sourceMap) return;

	decoder = { version: document.version, consumer: await new SourceMapConsumer(sourceMap) };
	consumers.set(document, decoder);
	return decoder.consumer;
}


export const emptyRange:Range = { start: { line: 0, character: 0}, end: {line: 0, character: 0} };


async function getSourceFileFromDocument(document: TextDocument): ts.SourceFileLike {

}



async function getOriginalLineAndCharacterOfPosition(document: TextDocument, character: number, line: number) {
	let decoder =  await getSourceMapConsumer(document);

}


function SpanToRange(      sourceMap?: SourceMapConsumer): Range {
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
*/