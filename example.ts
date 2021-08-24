import { LexerBuilder, Parser, TokenStream } from "./mod.ts";
import { AbstractIdent, AbstractString, AbstractWhiteSpace, BaseToken } from "./default_token_readers.ts";

type TokenType = "WS" | "IDENT" | "STRING";

class Ident extends AbstractIdent<TokenType> implements Parser<BaseToken<TokenType>, TokenType> {
	protected get type(): TokenType {
		return "IDENT";
	}
}
class String extends AbstractString<TokenType> {
	protected get type(): TokenType {
		return "STRING";
	}
}
class WhiteSpace extends AbstractWhiteSpace<TokenType> {
	protected get type(): TokenType {
		return "WS";
	}
	protected get skip(): boolean {
		return true;
	}
}


let lb = new LexerBuilder()
	.pushTokenReader(new Ident)
	.pushTokenReader(new String)
	.pushTokenReader(new WhiteSpace)
;

let lexer = lb.build(`
	ident
	"str'ing1"
	'str\\"\\'ing2'
`);


class TestParser implements Parser<{ ident: string, str1: string, str2: string }, TokenType> {
	parse(ts: TokenStream<TokenType>): { ident: string; str1: string; str2: string; } {
		let ident: BaseToken<TokenType> = ts.parse(Ident);
		let str1: BaseToken<TokenType> = ts.parse(String);
		let str2: BaseToken<TokenType> = ts.parse(String);
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