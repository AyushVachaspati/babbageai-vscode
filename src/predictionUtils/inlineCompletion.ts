import {debounceCompletions} from "./inlineCompletionAPI";
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

export const inlineCompletionProvider: vscode.InlineCompletionItemProvider = {
	async provideInlineCompletionItems(document, position, context, token) {
		// console.log("Triggered Completion");
		if(!validMidlinePosition(document,position)){
			return undefined;
		}
		if(context.selectedCompletionInfo) {
			return getLookAheadInlineCompletion(document, position, context, token);
		};
		return getInlineCompletion(document, position, context, token);
	},
};


/**	Provide inline completion based on VsCode intellisense popup suggestions (called lookAheadCompletion here)
 *	context.SelectedCompletionInfo corresponds to lookAheadSuggestion	
 */
async function getLookAheadInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, token:vscode.CancellationToken) {
	assert(context.selectedCompletionInfo,"LookAheadCompletion Called with InlineCompletion context.");
	let prefix = document.getText().slice(0,document.offsetAt(position));
	// let postfix = document.getText().substring(document.offsetAt(position));
	// let start_token = "<fim-prefix>";
	// let end_token = "<fim-suffix>";
	// let middle_token = "<fim-middle>";
	// if(postfix){
	// 	prefix = `${start_token}${prefix}${end_token}${postfix}${middle_token}`;
	// }
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
		let ifAcceptedLookAheadSuggestion = prediction? prediction.result.slice(prefix.length) : undefined;
		prompt.completionType = CompletionType.inlineSuggestion;
		ifAcceptedLookAheadSuggestion ? globalCache.set(sha1(JSON.stringify(prompt)),ifAcceptedLookAheadSuggestion) : undefined;
		
	}
	

	if(inlineCompletion){
		let completionItem :vscode.InlineCompletionItem = {
			insertText: inlineCompletion,
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

async function getInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, token:vscode.CancellationToken) {
	assert(context.selectedCompletionInfo===undefined,"InlineCompletion Called with LookAheadCompletion context.");
	let prefix = document.getText().slice(0,document.offsetAt(position));
	// let postfix = document.getText().substring(document.offsetAt(position));
	// let startToken = "<fim-prefix>";
	// let endToken = "<fim-suffix>";
	// let middleToken = "<fim-middle>";
	// if(postfix){
	// 	prefix = `${startToken}${prefix}${endToken}${postfix}${middleToken}`;
	// }
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

	if(inlineCompletion){
		let completionItem :vscode.InlineCompletionItem = {
			insertText: inlineCompletion,
			range: new vscode.Range(position, document.lineAt(position.line).range.end),  //replace everything until EOL. excluding new line char
			// range: new vscode.Range(position,position),
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