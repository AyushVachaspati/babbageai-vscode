// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Range} from 'vscode';

// Function to show Information to the user in a Information Box on the bottom right corner of the screen. 
function showInformation () {	
	vscode.window.showInformationMessage('Babbage AI Auto Code Complete is your friend! :D ');
};


// const object Provider which implements the Interface InlinCompletionItemProvider
const provider: vscode.InlineCompletionItemProvider = {
	async provideInlineCompletionItems(document, position, context, token) {
		console.log(context.selectedCompletionInfo); // This has the information about the current selection in the popup menu
		console.log(token);
		console.log(document.getText);
		console.log(position);
		// wait for 1 second
		// await new Promise(resolve => setTimeout(resolve, 1000));
		let result :vscode.InlineCompletionList = {
			items: []
		};


		// pushing a completion Item. this can have a filter, range and command to help with improving user experience.
		// Doesnt work When the Suggestion we provide does not match the suggestion selected by the user in the popup menu. (context.selectedCompletionInfo has the selected thing)
		result.items.push({
			insertText: context.selectedCompletionInfo !== undefined ? context.selectedCompletionInfo.text : "",
			filterText:undefined,
			range: undefined,
			command: undefined  // I can use this to register auto import, show status updates, and do other cleanup after suggestion accepted.
		});
	

		
		return result;
	},

};

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {		
	
	console.log('inline-completions demo started');
	context.subscriptions.push(
		vscode.commands.registerCommand('babbageai-vscode.showInfo', showInformation)
	);

	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider)
	);

	console.log('Congratulations, your extension "babbageai-vscode" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Deactivating Extension BabbageAI: GoodBye! :)');
}
