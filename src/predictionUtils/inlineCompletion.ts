import {debounceCompletions} from "./inlineCompletionAPI";
import * as vscode from 'vscode';
import { globalCache } from "../predictionCache/predictionCache";
import sha1 = require('sha1');
import assert = require("assert");
import { InlineModelConfig } from './inlineModelConfig';

export enum CompletionType {
    inlineSuggestion,
    lookAheadSuggestion 
}

export type CachePrompt = {
    prefix: string,
    completionType: CompletionType 
};

export const inlineCompletionProvider: vscode.InlineCompletionItemProvider = {
	async provideInlineCompletionItems(document, position, context, token) {
		// console.log("Triggered Completion");

		// INFO: validMidlinePositon is not needed with FIM task for the LLM
		// if(!validMidlinePosition(document,position)){
		// 	return undefined;
		// }
		if(context.selectedCompletionInfo) {
			return getLookAheadInlineCompletion(document, position, context, token);
		};
		return getInlineCompletion(document, position, context, token);
	},
};


/**	Provide inline completion based on VsCode intellisense popup suggestions (called lookAheadCompletion here)
 *	context.SelectedCompletionInfo corresponds to lookAheadSuggestion	
 */
async function getLookAheadInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, _token:vscode.CancellationToken) {
	// TODO: the prompt construction logic is completely model dependent. To make models switchable, this logic should be extracted out seperately for each model
	// and then a switch statement or something else should direct the prompt construction based on the model.
	assert(context.selectedCompletionInfo,"LookAheadCompletion Called with InlineCompletion context.");
	let prefix = document.getText().slice(0,document.offsetAt(position));
	let postfix = document.getText().substring(document.offsetAt(position));
	
	let startToken = InlineModelConfig.getInstance().getPrefixToken();
	let endToken = InlineModelConfig.getInstance().getSuffixToken();
	let middleToken = InlineModelConfig.getInstance().getMiddleToken();
	let prompt:string;
	let fillInMiddle:boolean = postfix.trim()?true:false;
	
	let popupRange = context.selectedCompletionInfo.range;
	let currentCompletion = document.getText(popupRange);

	prefix = prefix.slice(0, currentCompletion.length===0?undefined:-currentCompletion.length); 
	prefix = prefix + context.selectedCompletionInfo.text; //get prefix as if popup suggestion was accepted
	if(fillInMiddle){
		prompt = `${prefix}${middleToken}${postfix}`;
	}
	else{
		prompt = prefix;
	}
	console.log(prompt);

	let cacheItem:CachePrompt = {
		prefix: prompt, 
		completionType: CompletionType.lookAheadSuggestion
	};

	let key = sha1(JSON.stringify(cacheItem));
	let lookaheadCompletion:string|undefined = globalCache.get(key);

	if(!lookaheadCompletion){
		let prediction = await debounceCompletions(prompt);
		lookaheadCompletion = prediction? context.selectedCompletionInfo.text + prediction.result : undefined;
		lookaheadCompletion? globalCache.set(key, lookaheadCompletion) : undefined;
		
		// Also cache implied inlineSuggestion, this will be shown when user accepts LookAheadSuggestion in order to maintain a seamless experience.		
		let ifAcceptedLookAheadSuggestion = prediction? prediction.result.slice(prompt.length) : undefined;
		cacheItem.completionType = CompletionType.inlineSuggestion;
		let inlineKey = sha1(JSON.stringify(cacheItem));
		ifAcceptedLookAheadSuggestion ? globalCache.set(inlineKey,ifAcceptedLookAheadSuggestion) : undefined;
	}
	

	if(lookaheadCompletion){
		let completionItem :vscode.InlineCompletionItem = {
			insertText: lookaheadCompletion,
			range: popupRange,
			command: {
				command: 'artemusai-vscode.log',
				title: 'Log when Completion Accepted',
			}
		};
		return new vscode.InlineCompletionList([completionItem]);
	}
	return undefined;
	
}

async function getInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, _token:vscode.CancellationToken) {
	// TODO: the prompt construction logic is completely model dependent. To make models switchable, this logic should be extracted out seperately for each model
	// and then a switch statement or something else should direct the prompt construction based on the model.assert(context.selectedCompletionInfo===undefined,"InlineCompletion Called with LookAheadCompletion context.");
	let prefix = document.getText().slice(0,document.offsetAt(position));
	let postfix = document.getText().substring(document.offsetAt(position));
	
	let startToken = InlineModelConfig.getInstance().getPrefixToken();
	let endToken = InlineModelConfig.getInstance().getSuffixToken();
	let middleToken = InlineModelConfig.getInstance().getMiddleToken();
	
	let prompt:string;
	let fillInMiddle:boolean = postfix.trim()?true:false;
	
	if(fillInMiddle){
		prompt = `${prefix}${middleToken}${postfix}`;
	}
	else{
		prompt = prefix;
	}

	let cacheItem:CachePrompt = {
		prefix: prompt, 
		completionType: CompletionType.inlineSuggestion
	};
	
	console.log(prompt);
	let key = sha1(JSON.stringify(cacheItem));
	let inlineCompletion:string|undefined = globalCache.get(key);
	
	if(!inlineCompletion){
		let prediction = await debounceCompletions(prompt);
		inlineCompletion = prediction? prediction.result : undefined;
		inlineCompletion? globalCache.set(key, inlineCompletion) : undefined;
	}
	if(inlineCompletion){
		let completionItem :vscode.InlineCompletionItem = {
			insertText: inlineCompletion,
			// range: fillInMiddle ? 
			// 			new vscode.Range(position,position):
			// 			new vscode.Range(position, document.lineAt(position.line).range.end),  //replace everything until EOL. excluding new line char
			range: new vscode.Range(position,position),
			command: {
				command: 'artemusai-vscode.log',
				title: 'Log when Completion Accepted'
			}
		};
		return new vscode.InlineCompletionList([completionItem]);
	}
	return undefined;
}

function validMidlinePosition(document: vscode.TextDocument, position: vscode.Position) {
	const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");
	const suffixRange = new vscode.Range(position, document.lineAt(position.line).range.end);
	const suffixText = document.getText(suffixRange);
	return END_OF_LINE_VALID_REGEX.test(suffixText);
  }