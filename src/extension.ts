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
	// clear chat history from global state
	// context.globalState.update("Artemus-Chat-State",undefined)
	
	updateStatusBarArtemusLoading();

	//Register Artemus Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.showInfo', showInformation)
	);

	// Command which is not exposed to the user in command pallet. (Commands not in Package.json are only available programmatically)
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
	const artemusChatWebview = new ArtemusChatPanelProvider(context.extensionUri,context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ArtemusChatPanelProvider.viewType, artemusChatWebview,
			{
			webviewOptions: {
			  retainContextWhenHidden: true, // keeps the state of the webview even when it's not visible
			},
		  }
		)
	);
	
	// setting current panel to Chat panel
	vscode.commands.executeCommand('setContext', 'artemus-vscode.historyPanel',false);
	vscode.commands.executeCommand('setContext','artemus-vscode.currentChatPanel',true);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.newChat', ()=>{
			artemusChatWebview.createNewChat();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.historyView', ()=>{
			vscode.commands.executeCommand('setContext','artemus-vscode.historyPanel',true);
			vscode.commands.executeCommand('setContext','artemus-vscode.currentChatPanel',false);
			artemusChatWebview.showChatHistory();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.currentChat', ()=>{
			vscode.commands.executeCommand('setContext','artemus-vscode.historyPanel',false);
			vscode.commands.executeCommand('setContext','artemus-vscode.currentChatPanel',true);
			artemusChatWebview.showCurrentChat();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.explainCommand', ()=>{
			vscode.commands.executeCommand('setContext','artemus-vscode.historyPanel',false);
			vscode.commands.executeCommand('setContext','artemus-vscode.currentChatPanel',true);
			artemusChatWebview.showCurrentChat();
			artemusChatWebview.executeCommand('/explain');
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('artemusai-vscode.documentCommand', ()=>{
			vscode.commands.executeCommand('setContext','artemus-vscode.historyPanel',false);
			vscode.commands.executeCommand('setContext','artemus-vscode.currentChatPanel',true);
			artemusChatWebview.showCurrentChat();
			artemusChatWebview.executeCommand('/document');
		})
	);
	
	// Fake wait time of 1 second to show loading Item. 
	// Wait time will be usefull when we validate extension
	// api and need time to do it.
	await new Promise(resolve => setTimeout(resolve, 1000)); 

	console.log('Artemus AI is active!');
	updateStatusBarArtemusActive();
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Deactivating Extension ArtemusAI: GoodBye! :)');
}