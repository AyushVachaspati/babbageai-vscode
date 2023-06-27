// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Range} from 'vscode';

// Function to show Information to the user in a Information Box on the bottom right corner of the screen. 
function showInformation () {	
	vscode.window.showInformationMessage('Babbage AI Auto Code Complete is your friend! :D ');
};


// const object Provider which implements the Interface InlinCompletionItemProvider
// Need to debounce the function call somehow so that there are not too many API Calls when the user is typing.
const provider: vscode.InlineCompletionItemProvider = {
	async provideInlineCompletionItems(document, position, context, token) {
		console.log("Function Called");
		let prefix = document.getText().slice(0,document.offsetAt(position));
		let postfix = document.getText().slice(document.offsetAt(position));
		console.log(prefix+"<FIM_TOKEN>"+postfix)
		
		// wait for 1 second
		// await new Promise(resolve => setTimeout(resolve, 1000));
		let result :vscode.InlineCompletionList = {
			items: []
		};

		// Multiline suggestions are good to go! Nice.
		result.items.push({
			insertText: "This is a new test \nHow does Multiline suggestions work? \nNice!!! \n"
		});


		// pushing a completion Item. this can have a filter, range and command to help with improving user experience.
		// Doesnt work When the Suggestion we provide does not match the suggestion selected by the user in the popup menu. (context.selectedCompletionInfo has the selected thing)
		result.items.push({
			insertText: context.selectedCompletionInfo !== undefined ? context.selectedCompletionInfo.text : "",
			filterText:undefined,
			range: undefined,
			command: undefined  // I can use this to register auto import, show status updates, and do other cleanup after suggestion accepted.
		});
	

		console.log("Function Finished");
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