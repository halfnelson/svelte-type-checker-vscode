import { Position, Range } from 'vscode-languageserver';
import { serviceContainerForUri } from './LanguageService';
import { uriToFilePath, mapSpanToOriginalRange, getMapper, useSvelteTsxName, useSvelteOriginalName } from './util';
import { DocumentMapper } from './mapper';
import * as ts from 'typescript';
import { DocumentSnapshot } from './DocumentSnapshot';

export class DocumentContext {
	mapper: DocumentMapper;
	languageService: ts.LanguageService;
	program: ts.Program;
	uri: string;
	generatedSource: ts.SourceFile;
	snapshot: DocumentSnapshot;

	constructor(uri: string, mapper: DocumentMapper, languageService: ts.LanguageService, snapshot: DocumentSnapshot, program: ts.Program, generatedSource: ts.SourceFile) {
		this.uri = uri;
		this.mapper = mapper;
		this.languageService = languageService;
		this.snapshot = snapshot;
		this.program = program;
		this.generatedSource = generatedSource;
	}
	get generatedFilePath() {
		return useSvelteTsxName(uriToFilePath(this.uri));
	}

	get generatedUri() {
		return useSvelteTsxName(this.uri);
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
		let { languageService, getSnapshot } = serviceContainerForUri(svelteFileUri);
		let snapshot = getSnapshot(svelteFileUri);
		let mapper = await getMapper(svelteFileUri);
		let languageServiceFileName = uriToFilePath(useSvelteTsxName(svelteFileUri));
		let program = languageService.getProgram();
		if (!program) {
			console.log("Couldn't get program for hover for", svelteFileUri);
			return;
		}
		let source = program.getSourceFile(languageServiceFileName)!;
		if (!source) {
			console.log("Couldn't get source file for ", languageServiceFileName);
			return;
		}
		return new DocumentContext(svelteFileUri, mapper, languageService, snapshot, program, source);
	}
}
