import { Token } from "./structs.ts";
import { Lexer } from "./lexer.ts";

export interface Parser<O, T extends string> {
	parse(ts: TokenStream<T>): O;
}

export class TokenStream<T extends string> {
	private offset: number;
	private getToken: (index: number) => (Token<T> | undefined);
	
	public constructor(ts: Token<T>[] | Lexer<T>) {
		this.offset = 0;
		if (Array.isArray(ts)) {
			this.getToken = (index: number) => ts[index];
		} else {
			this.getToken = this.getTokenFromStream(ts);
		}
	}
	private getTokenFromStream(ts: Lexer<T>): (index: number) => (Token<T> | undefined) {
		let cache: Token<T>[] = [];
		return (index: number) => {
			let i = cache.length;
			let tmp;
			while (i <= index && (tmp = ts.readNextToken()) != null) if (!tmp.skip) cache[i++] = tmp.token;
			return cache[index];
		};
	}
	public parse<O, S extends Parser<O, T>>(parser: { new(): S }): O {
		return (new parser()).parse(this);
	}
	public parseNoError<O, S extends Parser<O, T>>(parser: { new(): S }): O | undefined {
		let offset = this.offset;
		try {
			return (new parser()).parse(this);
		} catch {
			this.offset = offset;
			return undefined;
		}
	}
	public peek<O, S extends Parser<O, T>>(parser: { new(): S }): boolean {
		let offset = this.offset;
		let result = true;
		try {
			(new parser()).parse(this);
		} catch {
			result = false;
		}
		this.offset = offset;
		return result;
	}
	public getNextToken(): Token<T> | undefined {
		return this.getToken(this.offset++);
	}
	public getNextTokenStrict<F extends T>(...type: F[]): Token<F> {
		let token = this.getNextToken();
		if (token == null) throw "Expected '" + type + "' token type, found EOF.";
		
		if ((type as string[]).includes(token.type)) {
			return token as Token<F>;
		} else {
			throw "Expected '" + type + "' token type, found '" + token.type + "'.";
		}
	}
	
}