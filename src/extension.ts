import * as vscode from 'vscode';
import { inlineCompletionProvider } from './predictionUtils/inlineCompletion';
import { statusBarItem, updateStatusBarBabbageActive, updateStatusBarBabbageLoading } from './statusBar/statusBar';

// Function to show Information to the user in a Information Box on the bottom right corner of the screen. 
function showInformation() {	
	vscode.window.showInformationMessage('Welcome to Babbage AI');
};

function printLog(){
	console.log("User Accepted Suggestoin"); // Use this place to log telemetary data.

	// The inlineSuggest command only triggers if we give some delay.. even 1ms delay seems to make it work
    setTimeout(()=>{vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");}, 10);  
}

// This method is called when your extension is activated
// Use this to register all the commands and CompletionProviders + Handlers for other stuff.
export async function activate(context: vscode.ExtensionContext) {
	updateStatusBarBabbageLoading();

	//Register Babbage Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('babbageai-vscode.showInfo', showInformation)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('babbageai-vscode.log', printLog)
	);

	//Register Babbage Inline Code Completion
	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineCompletionProvider)
	);
	
	//Register Babbage Status Bar Item for Disposal
	context.subscriptions.push(statusBarItem);
	
	await new Promise(resolve => setTimeout(resolve, 3000)); //Fake wait time of 3 seconds to show loading Item. Wait time will be usefull when we validate stuff online.
	
	console.log('Babbage AI is active!');
	updateStatusBarBabbageActive();
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Deactivating Extension BabbageAI: GoodBye! :)');
}