import { Position, Range } from 'vscode-languageserver';
import { serviceContainerForUri } from './LanguageService';
import { uriToFilePath, mapSpanToOriginalRange, getMapper } from './util';
import { DocumentMapper } from './mapper';
import * as ts from 'typescript';

export class DocumentContext {
	mapper: DocumentMapper;
	languageService: ts.LanguageService;
	program: ts.Program;
	uri: string;
	generatedSource: ts.SourceFile;
	constructor(uri: string, mapper: DocumentMapper, languageService: ts.LanguageService, program: ts.Program, generatedSource: ts.SourceFile) {
		this.uri = uri;
		this.mapper = mapper;
		this.languageService = languageService;
		this.program = program;
		this.generatedSource = generatedSource;
	}
	get generatedFilePath() {
		return uriToFilePath(this.uri) + ".tsx";
	}

	get generatedUri() {
		return this.uri + ".tsx";
	}

	generatedPositionFromOriginalPosition(position: Position): ts.LineAndCharacter | undefined {
		return this.mapper.getGeneratedPosition(position);
	}
	generatedOffsetFromGeneratedPosition(position: Position): number {
		return this.generatedSource.getPositionOfLineAndCharacter(position.line, position.character);
	}
	generatedOffsetFromOriginalPosition(position: Position): number | undefined {
		const genPos = this.generatedPositionFromOriginalPosition(position);
		return genPos ? this.generatedOffsetFromGeneratedPosition(genPos) : undefined;
	}
	originalRangeFromGeneratedSpan(span: ts.TextSpan): Range {
		return mapSpanToOriginalRange(this.mapper, this.generatedSource, span.start, span.length);
	}
	static async createFromUri(svelteFileUri: string): Promise<DocumentContext | undefined> {
		let { languageService } = serviceContainerForUri(svelteFileUri);
		let mapper = await getMapper(svelteFileUri);
		let languageServiceFileName = uriToFilePath(svelteFileUri) + ".tsx";
		let program = languageService.getProgram();
		if (!program) {
			console.log("Couldn't get program for hover for", svelteFileUri);
			return;
		}
		let source = program.getSourceFile(languageServiceFileName)!;
		if (!source) {
			console.log("Couldn't get source file for ", svelteFileUri + ".tsx");
			return;
		}
		return new DocumentContext(svelteFileUri, mapper, languageService, program, source);
	}
}
