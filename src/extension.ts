import * as vscode from 'vscode';
import { inlineCompletionProvider } from './predictionUtils/inlineCompletion';
import { statusBarItem, updateStatusBarArtemusActive, updateStatusBarArtemusLoading } from './statusBar/statusBar';
import { ArtemusChatPanelProvider } from './artemusChat/artemusChatPanelProvider';

// Function to show Information to the user in a Information Box on the bottom right corner of the screen. 
function showInformation() {	
	vscode.window.showInformationMessage('Welcome to Artemus AI');
};

function printLog(){
	console.log("User Accepted Suggestion"); // Use this place to log telemetary data.

	// The inlineSuggest command only triggers if we give some delay.. even 1ms delay seems to make it work
    setTimeout(()=>{vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");}, 10);  
}

// This method is called when your extension is activated
// Use this to register all the commands and CompletionProviders + Handlers for other stuff.
export async function activate(context: vscode.ExtensionContext) {
	updateStatusBarArtemusLoading();

	//Register Artemus Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.showInfo', showInformation)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.log', printLog)
	);

	//Register Artemus Inline Code Completion
	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineCompletionProvider)
	);
	
	//Register Artemus Status Bar Item for Disposal
	context.subscriptions.push(statusBarItem);
	
	//Register Artemus Chat Panel
	const artemusChatWebview = new ArtemusChatPanelProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ArtemusChatPanelProvider.viewType, artemusChatWebview)
	);
	
	await new Promise(resolve => setTimeout(resolve, 1000)); //Fake wait time of 3 seconds to show loading Item. Wait time will be usefull when we validate stuff online.
	
	console.log('Artemus AI is active!');
	updateStatusBarArtemusActive();
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Deactivating Extension ArtemusAI: GoodBye! :)');
}