import {debounceCompletions, Result} from "./callApi";
import * as vscode from 'vscode';

// const object Provider which implements the Interface InlinCompletionItemProvider
export const inlineCompletionProvider: vscode.InlineCompletionItemProvider = {
	async provideInlineCompletionItems(document, position, context, token) {
		console.log('Inline Completion Triggered');
		// If lookAheadSuggestion is active (The popup suggestions which VsCode gives)
		if(context.selectedCompletionInfo) {
			return getLookAheadInlineCompletion(document, position, context, token);
		};

		return getInlineCompletion(document, position, context, token);
	},
};

async function getLookAheadInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, token:vscode.CancellationToken) {
	if(!context.selectedCompletionInfo){
		return undefined;
	}

	let prefix = document.getText().slice(0,document.offsetAt(position));
	let postfix = document.getText().slice(document.offsetAt(position));
	// console.log(prefix+"<FIM_TOKEN>"+postfix);
	
	let popupRange = context.selectedCompletionInfo.range;
	let currentCompletion = document.getText(popupRange);
	let replaceRange = new vscode.Range(position.translate(0,-currentCompletion.length),position);
	prefix = prefix.slice(0, currentCompletion.length===0?undefined:-currentCompletion.length); 
	prefix = prefix + context.selectedCompletionInfo.text; //get prefix as if popup suggestion was accepted
	
	let prediction = await debounceCompletions(prefix);

	if(prediction){
		let inlineCompletion = (context.selectedCompletionInfo.text + prediction.result.slice(prefix.length)).slice(currentCompletion.length);
		let completionItem :vscode.InlineCompletionItem = {
			filterText: inlineCompletion,  // what does filter text do and how can we use this to improve user experience ( it seems like that it actually doesn't do anything in the code)
			insertText: new vscode.SnippetString(inlineCompletion), //learn the intricasies of SnippetString (looks like the insertText is also used as the filter text. since if I add random stuff at the end it doesnt count)
			range: new vscode.Range(position,position),   //learn how Range works, article explaining it is bookmarked, I need to find EOL Position or end of word positon somehow.
														// console.log(12 |_| ))) when the cursor is at |_| and the range is (positon to positon.translate(0,5)), completion is 3);, so completion is adding 2 chars and the things has to replace 3 chhars to they add up to 5.
			command: {
				command: 'babbageai-vscode.log',
				title: 'Log when Completion Accepted',
			}
		};
		return new vscode.InlineCompletionList([completionItem]);
	}
	return undefined;
}

async function getInlineCompletion(document:vscode.TextDocument, position:vscode.Position, context: vscode.InlineCompletionContext, token:vscode.CancellationToken) {
	let prefix = document.getText().slice(0,document.offsetAt(position));
	let postfix = document.getText().slice(document.offsetAt(position));
	// console.log(prefix+"<FIM_TOKEN>"+postfix);
	
	let prediction = await debounceCompletions(prefix);
	
	if(prediction){
		let inlineCompletion = prediction.result.slice(prefix.length);
		let completionItem :vscode.InlineCompletionItem = {
			filterText: inlineCompletion,  // what does filter text do and how can we use this to improve user experience ( it seems like that it actually doesn't do anything in the code)
			insertText: new vscode.SnippetString(inlineCompletion), //learn the intricasies of SnippetString (looks like the insertText is also used as the filter text. since if I add random stuff at the end it doesnt count)
			range: new vscode.Range(position,position),   //learn how Range works, article explaining it is bookmarked, I need to find EOL Position or end of word positon somehow.
															// console.log(12 |_| ))) when the cursor is at |_| and the range is (positon to positon.translate(0,5)), completion is 3);, so completion is adding 2 chars and the things has to replace 3 chhars to they add up to 5.
			command: {
				command: 'babbageai-vscode.log',
				title: 'Log when Completion Accepted'
			}
		};
		return new vscode.InlineCompletionList([completionItem]);
	}
	return undefined;
}