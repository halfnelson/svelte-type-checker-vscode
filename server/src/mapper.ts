import { SourceMapConsumer } from 'source-map';
import * as ts from 'typescript';
import { stringify } from 'querystring';

export interface DocumentMapper {
    getOriginalPosition(generatedPosition: ts.LineAndCharacter): ts.LineAndCharacter | undefined
    getGeneratedPosition(originalPosition: ts.LineAndCharacter): ts.LineAndCharacter | undefined 
}

export class IdentityMapper implements DocumentMapper {
    getOriginalPosition(generatedPosition: ts.LineAndCharacter): ts.LineAndCharacter | undefined {
        return generatedPosition;
    }
    getGeneratedPosition(originalPosition: ts.LineAndCharacter): ts.LineAndCharacter | undefined {
        return originalPosition;
    }
}

export class ConsumerDocumentMapper implements DocumentMapper {
    consumer: SourceMapConsumer;
    sourceUri: string;
    constructor(consumer: SourceMapConsumer, sourceUri: string) {
        this.consumer = consumer;
        this.sourceUri = sourceUri;
    }

    getOriginalPosition(generatedPosition: ts.LineAndCharacter): ts.LineAndCharacter | undefined {
        let mapped = this.consumer.originalPositionFor({ line: generatedPosition.line + 1, column: generatedPosition.character })
        if (!mapped) return;
        return {
            line: mapped.line - 1,
            character: mapped.column
        }
    }

    getGeneratedPosition(originalPosition: ts.LineAndCharacter): ts.LineAndCharacter | undefined {
        let mapped = this.consumer.generatedPositionFor({ line: originalPosition.line + 1, column: originalPosition.character, source: this.sourceUri })
        if (!mapped) return;
        return {
            line: mapped.line - 1,
            character: mapped.column
        }
    }
}