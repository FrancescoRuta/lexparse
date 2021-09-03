import { TokenReader, Token, TokenReaderOutput, LineColumn, Span } from "./structs.ts";

export class LexerBuilder<T extends string> {
	private readers: TokenReader<T>[];
	
	public constructor() {
		this.readers = [];
	}
	public pushTokenReader(reader: TokenReader<T>): LexerBuilder<T> {
		this.readers.push(reader);
		return this;
	}
	public build(str: string, filename?: string): Lexer<T> {
		return new Lexer(str, [...this.readers], filename ?? "<anonymous>");
	}
	
}

export class Lexer<T extends string> {
	private offset: number;
	private currentLine;
	private currentColumn;
	private spanGroup: {};
	private str: string;
	
	public constructor(str: string, private readers: TokenReader<T>[], private filename: string) {
		this.str = str.replaceAll(/\r\n/gm, "\n").replaceAll(/\r/gm, "\n");
		this.offset = 0;
		this.currentLine = 1;
		this.currentColumn = 1;
		this.spanGroup = {};
	}
	public getAllRemainingTokens(): Token<T>[] {
		let res = [];
		let tmp;
		while (tmp = this.readNextToken()) {
			if (!tmp.skip) res.push(tmp.token);
		}
		return res;
	}
	public readNextToken(): { token: Token<T>, skip: boolean } | null {
		if (this.offset == this.str.length) return null;
		let str = this.str.substring(this.offset);
		let res: TokenReaderOutput<T> = null;
		for (let reader of this.readers) {
			if ((res = reader.tryRead(str, this)) != null) {
				if (res.length == 0)
					res = null;
				else
					break;
			}
		}
		if (res == null) throw new Error("Error while tokenizing string: '" + str + "'");
		this.offset += res.length;
		let content = str.substring(0, res.length);
		let linesNoLast = content.substring(0, content.length - 1).split("\n");
		let lines = content.split("\n");
		
		let begin: LineColumn = {
			line: this.currentLine,
			column: this.currentColumn
		};
		
		let end: LineColumn = {
			line: this.currentLine + linesNoLast.length - 1,
			column: (linesNoLast.length > 1 ? 1 : this.currentColumn) + linesNoLast[linesNoLast.length - 1].length
		};
		
		this.currentLine += lines.length - 1;
		if (lines.length > 1) this.currentColumn = 1;
		this.currentColumn += lines[lines.length - 1].length;
		
		
		let span = new Span(begin, end, this.filename, this.spanGroup);
		let result = new Token<T>(res.type, content, span);
		
		return { token: result, skip: res.skip === true };
	}
	
}

