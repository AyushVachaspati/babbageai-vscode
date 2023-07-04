// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { inlineCompletionProvider } from './predictionUtils/inlineCompletion';

// Function to show Information to the user in a Information Box on the bottom right corner of the screen. 
async function showInformation() {	
	vscode.window.showInformationMessage('Welcome to Babbage AI');
};

async function printLog(){
	console.log("Completion Accepted");
}

// This method is called when your extension is activated
// Use this to register all the commands and CompletionProviders + Handlers for other stuff.
export function activate(context: vscode.ExtensionContext) {		
	
	console.log('inline-completions demo started');
	context.subscriptions.push(
		vscode.commands.registerCommand('babbageai-vscode.showInfo', showInformation)
	);


	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineCompletionProvider)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('babbageai-vscode.log', printLog)
	);	

	console.log('Congratulations, your extension "babbageai-vscode" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Deactivating Extension BabbageAI: GoodBye! :)');
}