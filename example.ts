import { LexerBuilder, TokenReader, TokenReaderOutput, Parser, Span, TokenStream } from "./mod.ts";

type TokenType = "WS" | "IDENT" | "STRING";

function testRegex(regex: RegExp, char: string): boolean {
	return char != null && regex.test(char);
}

interface BaseToken<V> {
	type: TokenType;
	rawContent: string;
	value: V;
	span: Span;
}

class Ident implements TokenReader<TokenType>, Parser<BaseToken<string>, TokenType> {
	parse(ts: TokenStream<TokenType>): BaseToken<string> {
		let value = ts.getNextTokenStrict("IDENT");
		return {
			type: value.type,
			rawContent: value.content,
			value: value.content,
			span: value.span
		}
	}
	tryRead(str: string): TokenReaderOutput<TokenType> {
		let length = 1;
		let firstChar = /[a-zA-Z\_\$]/;
		let allChars = /[a-zA-Z\_\$0-9]/;
		if (!testRegex(firstChar, str[0])) return null;
		while (testRegex(allChars, str[length])) length++;
		return {
			length,
			type: "IDENT",
			skip: false,
		}
	}
}

class WhiteSpace implements TokenReader<TokenType>, Parser<BaseToken<null>, TokenType> {
	parse(ts: TokenStream<TokenType>): BaseToken<null> {
		let value = ts.getNextTokenStrict("WS");
		return {
			type: value.type,
			rawContent: value.content,
			value: null,
			span: value.span
		}
	}
	tryRead(str: string): TokenReaderOutput<TokenType> {
		let length = 0;
		while (str[length] == "\n" || str[length] == " " || str[length] == "\t" || str[length] == "\r" || str[length] == "\v") length++;
		return {
			length,
			type: "WS",
			skip: true,
		}
	}
}

class String implements TokenReader<TokenType>, Parser<BaseToken<string>, TokenType> {
	parse(ts: TokenStream<TokenType>): BaseToken<string> {
		let value = ts.getNextTokenStrict("STRING");
		let str = "";
		let i = 0;
		while (i < value.content.length) {
			if (value.content[i] == "\\") ++i;
			str += value.content[i++];
		}
		return {
			type: value.type,
			rawContent: value.content,
			value: str,
			span: value.span
		}
	}
	tryRead(str: string): TokenReaderOutput<TokenType> {
		let length = 1;
		let delimiter = str[0];
		if (delimiter != "\"" && delimiter != "'") return null;
		while (str[length] != delimiter && str.length > length) {
			if (str[length] == "\\") length++;
			length++;
		}
		if (str.length == length) return null;
		length++;
		return {
			length,
			type: "STRING",
			skip: false,
		}
	}
}

let lb = new LexerBuilder()
	.pushTokenReader(new Ident())
	.pushTokenReader(new String())
	.pushTokenReader(new WhiteSpace())
;

let lexer = lb.build(`
	prova
	"str'ing1"
	'str\\"\\'ing2'
`);


class TestParser implements Parser<{ ident: string, str1: string, str2: string }, TokenType> {
	parse(ts: TokenStream<TokenType>): { ident: string; str1: string; str2: string; } {
		let ident: BaseToken<string> = ts.parse(Ident);
		let str1: BaseToken<string> = ts.parse(String);
		let str2: BaseToken<string> = ts.parse(String);
		return {
			ident: ident.value,
			str1: str1.value,
			str2: str2.value,
		};
	}
}


let tokens = lexer.getAllRemainingTokens();
let ts = new TokenStream(tokens);
console.log(ts.parse(TestParser));