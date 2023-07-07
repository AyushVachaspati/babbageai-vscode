import {debounceCompletions, Result} from "./callApi";
import * as vscode from 'vscode';
import { globalCache } from "../predictionCache/predictionCache";
import sha1 = require('sha1');
import assert = require("assert");

export enum CompletionType {
    inlineSuggestion,
    lookAheadSuggestion 
}

export type CachePrompt = {
    prefix: string,
    completionType: CompletionType 
};

async function waitFor(delay:number) {
	return new Promise(f => setTimeout(f, delay));
}

export const inlineCompletionProvider: vscode.InlineCompletionItemProvider = {
	
	async provideInlineCompletionItems(document, position, context, token) {
		console.log("Triggered Completion");
		if(context.selectedCompletionInfo) {
			return getLookAheadInlineCompletion(document, position, context, token);
		};
		return getInlineCompletion(document, position, context, token);
	},
};

/**	Provide inline completion consistent with the VsCode intellisense popup suggestions (called lookAheadCompletion here)
 *	SelectedCompletionInfo corresponds to the lookAheadSuggestion	
 */
async function getLookAheadInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, token:vscode.CancellationToken) {
	assert(context.selectedCompletionInfo,"LookAheadCompletion Called with InlineCompletion context.");
	let prefix = document.getText().slice(0,document.offsetAt(position));
	// let postfix = document.getText().slice(document.offsetAt(position));
	// console.log(prefix+"<FIM_TOKEN>"+postfix);
	
	let popupRange = context.selectedCompletionInfo.range;
	let currentCompletion = document.getText(popupRange);
	let replaceRange = new vscode.Range(position.translate(0,-currentCompletion.length),position);
	prefix = prefix.slice(0, currentCompletion.length===0?undefined:-currentCompletion.length); 
	prefix = prefix + context.selectedCompletionInfo.text; //get prefix as if popup suggestion was accepted
	
	let prompt:CachePrompt = {
		prefix: prefix, 
		completionType: CompletionType.lookAheadSuggestion
	};

	let inlineCompletion:string|undefined = globalCache.get(sha1(JSON.stringify(prompt)));

	if(!inlineCompletion){
		let prediction = await debounceCompletions(prefix);
		inlineCompletion = prediction? context.selectedCompletionInfo.text + prediction.result.slice(prefix.length) : undefined;
		inlineCompletion? globalCache.set(sha1(JSON.stringify(prompt)), inlineCompletion) : undefined;

		// Also cache inlineSuggestion, this will be shown when user accepts LookAheadSuggestion in order to maintain a seamless experience.		
		let ifAcceptedInlineCompletion = prediction? prediction.result.slice(prefix.length) : undefined;
		prompt.completionType = CompletionType.inlineSuggestion;
		ifAcceptedInlineCompletion ? globalCache.set(sha1(JSON.stringify(prompt)),ifAcceptedInlineCompletion) : undefined;

	}
	
	if(token.isCancellationRequested){return undefined;}

	if(inlineCompletion){
		let completionItem :vscode.InlineCompletionItem = {
			filterText: inlineCompletion,  // what does filter text do and how can we use this to improve user experience ( it seems like that it actually doesn't do anything in the code)
			insertText: new vscode.SnippetString(inlineCompletion), //learn the intricasies of SnippetString (looks like the insertText is also used as the filter text. since if I add random stuff at the end it doesnt count)
			range: popupRange,   //learn how Range works, article explaining it is bookmarked, I need to find EOL Position or end of word positon somehow.
			command: {									  // console.log(12 |_| ))) when the cursor is at |_| and the range is (positon to positon.translate(0,5)), completion is 3);, so completion is adding 2 chars and the things has to replace 3 chhars to they add up to 5.
				command: 'babbageai-vscode.log',
				title: 'Log when Completion Accepted',
			}
		};
		return new vscode.InlineCompletionList([completionItem]);
	}
	return undefined;
	
}

async function getInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, token:vscode.CancellationToken) {
	assert(context.selectedCompletionInfo===undefined,"InlineCompletion Called with LookAheadCompletion context.");
	let prefix = document.getText().slice(0,document.offsetAt(position));
	// let postfix = document.getText().slice(document.offsetAt(position));
	// console.log(prefix+"<FIM_TOKEN>"+postfix);
	
	let prompt:CachePrompt = {
		prefix: prefix, 
		completionType: CompletionType.inlineSuggestion
	};
	
	let inlineCompletion:string|undefined = globalCache.get(sha1(JSON.stringify(prompt)).toString());
	
	if(!inlineCompletion){
		let prediction = await debounceCompletions(prefix);
		inlineCompletion = prediction? prediction.result.slice(prefix.length) : undefined;
		inlineCompletion? globalCache.set(sha1(JSON.stringify(prompt)), inlineCompletion) : undefined;
	}
	
	if(token.isCancellationRequested){return undefined;}

	if(inlineCompletion){
		let completionItem :vscode.InlineCompletionItem = {
			filterText: inlineCompletion,  // what does filter text do and how can we use this to improve user experience ( it seems like that it actually doesn't do anything in the code)
			insertText: new vscode.SnippetString(inlineCompletion), //learn the intricasies of SnippetString (looks like the insertText is also used as the filter text. since if I add random stuff at the end it doesnt count)
			range: new vscode.Range(position,position),   //learn how Range works, article explaining it is bookmarked, I need to find EOL Position or end of word positon somehow.
			command: {									  // console.log(12 |_| ))) when the cursor is at |_| and the range is (positon to positon.translate(0,5)), completion is 3);, so completion is adding 2 chars and the things has to replace 3 chhars to they add up to 5.
				command: 'babbageai-vscode.log',
				title: 'Log when Completion Accepted'
			}
		};
		return new vscode.InlineCompletionList([completionItem]);
	}
	return undefined;
}