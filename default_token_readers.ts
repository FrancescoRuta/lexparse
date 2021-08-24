import { TokenReader, TokenReaderOutput, Parser, Span, TokenStream } from "./mod.ts";

export function testRegex(regex: RegExp, char: string): boolean {
	return char != null && regex.test(char);
}

export interface BaseToken<T extends string> {
	type: T;
	rawContent: string;
	value: string;
	span: Span;
}

export abstract class AbstractIdent<T extends string> implements TokenReader<T>, Parser<BaseToken<T>, T> {
	protected abstract get type(): T;
	protected get skip(): boolean {
		return false;
	}
	protected get allowedFirstChars(): RegExp {
		return /[a-zA-Z\_\$]/;
	}
	protected get allowedChars(): RegExp {
		return /[a-zA-Z\_\$0-9]/;
	}
	public parse(ts: TokenStream<T>): BaseToken<T> {
		let value = ts.getNextTokenStrict(this.type);
		return {
			type: value.type,
			rawContent: value.content,
			value: value.content,
			span: value.span
		}
	}
	public tryRead(str: string): TokenReaderOutput<T> {
		let length = 1;
		let firstChar = this.allowedFirstChars;
		let allChars = this.allowedChars;
		if (!testRegex(firstChar, str[0])) return null;
		while (testRegex(allChars, str[length])) length++;
		return {
			length,
			type: this.type,
			skip: this.skip,
		}
	}
}

export abstract class AbstractInteger<T extends string> implements TokenReader<T>, Parser<BaseToken<T>, T> {
	protected abstract get type(): T;
	protected get skip(): boolean {
		return false;
	}
	public parse(ts: TokenStream<T>): BaseToken<T> {
		let value = ts.getNextTokenStrict(this.type);
		return {
			type: value.type,
			rawContent: value.content,
			value: value.content.replaceAll(/\_/, ""),
			span: value.span
		}
	}
	public tryRead(str: string): TokenReaderOutput<T> {
		let length = 1;
		while (testRegex(/[0-9\_]/, str[length])) length++;
		return {
			length,
			type: this.type,
			skip: this.skip,
		}
	}
}

export abstract class AbstractReal<T extends string> implements TokenReader<T>, Parser<BaseToken<T>, T> {
	protected abstract get type(): T;
	protected get skip(): boolean {
		return false;
	}
	public parse(ts: TokenStream<T>): BaseToken<T> {
		let value = ts.getNextTokenStrict(this.type);
		return {
			type: value.type,
			rawContent: value.content,
			value: value.content.replaceAll(/\_/, ""),
			span: value.span
		}
	}
	public tryRead(str: string): TokenReaderOutput<T> {
		let length = 1;
		while (testRegex(/[0-9\_]/, str[length])) length++;
		if (str[length++] != ".") return null;
		if (!testRegex(/[0-9]/, str[length++])) return null;
		while (testRegex(/[0-9\_]/, str[length])) length++;
		return {
			length,
			type: this.type,
			skip: this.skip,
		}
	}
}

export abstract class AbstractCharInSet<T extends string> implements TokenReader<T>, Parser<BaseToken<T>, T> {
	protected abstract get type(): T;
	protected get skip(): boolean {
		return false;
	}
	protected abstract get charSet(): string[];
	public parse(ts: TokenStream<T>): BaseToken<T> {
		let value = ts.getNextTokenStrict(this.type);
		return {
			type: value.type,
			rawContent: value.content,
			value: value.content,
			span: value.span
		}
	}
	public tryRead(str: string): TokenReaderOutput<T> {
		if (this.charSet.includes(str[0]))
			return {
				length: 1,
				type: this.type,
				skip: this.skip,
			};
		else
			return null;
	}
}

export abstract class AbstractStringInCharSet<T extends string> implements TokenReader<T>, Parser<BaseToken<T>, T> {
	protected abstract get type(): T;
	protected get skip(): boolean {
		return false;
	}
	protected abstract get charSet(): string[];
	public parse(ts: TokenStream<T>): BaseToken<T> {
		let value = ts.getNextTokenStrict(this.type);
		return {
			type: value.type,
			rawContent: value.content,
			value: value.content,
			span: value.span
		}
	}
	public tryRead(str: string): TokenReaderOutput<T> {
		let length = 0;
		while (this.charSet.includes(str[length])) length++;
		return {
			length,
			type: this.type,
			skip: this.skip,
		}
	}
}

export abstract class AbstractWhiteSpace<T extends string> extends AbstractStringInCharSet<T> {
	protected get charSet(): string[] {
		return [" ", "\t", "\n", "\r", "\v", "\f"];
	}
}

export abstract class AbstractPunctuation<T extends string> extends AbstractCharInSet<T> {
	protected get charSet(): string[] {
		return [
			"!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/",
			":", ";",  "<", "=", ">", "?", "@",
			"[", "\\",  "]", "^", "_", "`", 
			"{", "|",  "}", "~",
		];
	}
}

export abstract class AbstractString<T extends string> implements TokenReader<T>, Parser<BaseToken<T>, T> {
	protected abstract get type(): T;
	protected get escapeChar(): string {
		return "\\";
	}
	protected get allowedDelimiters(): string[] {
		return ["\"", "'"];
	}
	protected get skip(): boolean {
		return false;
	}
	public parse(ts: TokenStream<T>): BaseToken<T> {
		let value = ts.getNextTokenStrict(this.type);
		let str = "";
		let i = 0;
		let escapeChar = this.escapeChar;
		while (i < value.content.length) {
			if (value.content[i] == escapeChar) ++i;
			str += value.content[i++];
		}
		return {
			type: value.type,
			rawContent: value.content,
			value: str,
			span: value.span
		}
	}
	public tryRead(str: string): TokenReaderOutput<T> {
		let length = 1;
		let delimiter = str[0];
		let escapeChar = this.escapeChar;
		if (!this.allowedDelimiters.includes(delimiter)) return null;
		while (str[length] != delimiter && str.length > length) {
			if (str[length] == escapeChar) length++;
			length++;
		}
		if (str.length == length) return null;
		length++;
		return {
			length,
			type: this.type,
			skip: this.skip,
		}
	}
}