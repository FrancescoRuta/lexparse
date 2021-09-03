import { Lexer } from "./lexer.ts";

export interface LineColumn {
	line: number;
	column: number;
}

export class Span {
	public constructor(private begin_: LineColumn, private end_: LineColumn, private filename: string, private spanGroup: {}) {}
	public get begin(): LineColumn {
		return {...this.begin_};
	}
	public get end(): LineColumn {
		return {...this.end_};
	}
	public join(span: Span): Span {
		if (this.spanGroup != span.spanGroup) throw new Error("Joining between two spans from different lexer instances isn't allowed.");
		let begin;
		if (this.begin_.line < span.begin_.line) {
			begin = this.begin;
		} else if (this.begin_.line > span.begin_.line) {
			begin = span.begin;
		} else if (this.begin_.column < span.begin_.column) {
			begin = this.begin;
		} else {
			begin = span.begin;
		}
		let end;
		if (this.end_.line > span.end_.line) {
			end = this.end;
		} else if (this.end_.line < span.end_.line) {
			end = span.end;
		} else if (this.end_.column > span.end_.column) {
			end = this.end;
		} else {
			end = span.end;
		}
		return new Span(begin, end, this.filename, this.spanGroup);
	}
}

export class Token<T extends string> {
	public constructor(private type_: T, private content_: string, private span_: Span) {}
	public get type(): T {
		return this.type_;
	}
	public get content(): string {
		return this.content_;
	}
	public get span(): Span {
		return this.span_;
	}
}

export interface TokenReaderOkOutput<T extends string> {
	length: number;
	type: T;
	skip: boolean;
}

export type TokenReaderOutput<T extends string> = null | TokenReaderOkOutput<T>;

export interface TokenReader<T extends string> {
	tryRead(str: string, lerxerInstance: Lexer<T>): TokenReaderOutput<T>;
}