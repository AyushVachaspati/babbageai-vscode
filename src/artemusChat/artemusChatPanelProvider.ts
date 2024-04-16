import * as vscode from "vscode";
import { getNonce } from "./utils/nonce";
import assert = require("assert");
import { debounceCompletions } from "../predictionUtils/inlineCompletionAPI";
import { getModelPredictionStream } from "../predictionUtils/chatResponseAPI";
import { updateStatusBarArtemusActive, updateStatusBarFetchingPrediction } from "../statusBar/statusBar";
import { ModelStreamInferResponse__Output } from "../predictionUtils/tritonGrpc/generated/inference/ModelStreamInferResponse";
import { ModelInferRequest } from "../predictionUtils/tritonGrpc/generated/inference/ModelInferRequest";
import { ClientDuplexStream } from "@grpc/grpc-js";
import type {ChatContext, ChatHistory, ChatHistoryItem}  from "./webviews/types/chatState";
import { constructPrompt } from "./utils/promptGenerator";
import { getCodePreview } from "./utils/getCodePreview";

export class ArtemusChatPanelProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'artemusai-vscode.chatpanel';

	public view?: vscode.WebviewView;
    private doc?: vscode.TextDocument;
	private streamClient: ClientDuplexStream<ModelInferRequest, ModelStreamInferResponse__Output> | undefined;

	constructor(private readonly _extensionUri: vscode.Uri, private context: vscode.ExtensionContext) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			],
		};
		
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
		
		webviewView.onDidChangeVisibility(() => {
			if(webviewView.visible!==true){
				// this.streamClient?.cancel();
				// this.streamClient = undefined;
			}	
		});

		webviewView.onDidDispose(()=>{
			console.log("Disposed");
		});

		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case 'disableArtemusCommands':
					{
						// disable commands when chat is busy fetching
						vscode.commands.executeCommand("setContext","artemus-vscode.enableArtemusCommands",false);
						break;
					}
				case 'enableArtemusCommands':
					{
						// enable commands when chat has completed fetching
						vscode.commands.executeCommand("setContext","artemus-vscode.enableArtemusCommands",true);
						break;
					}
				case 'insertCode':
					{
						let code = data.code;
						let editor = vscode.window.activeTextEditor;
						if(!editor){ break; }
						let selection = editor.selection;
						editor.edit((editBuilder) => {
							editBuilder.replace(selection, code);
						});
						break;
					}
				case 'startGeneration':
					{
						let prompt: string;
						try{
							prompt = await constructPrompt(data.chat);
						}
						catch (error){
							this.commandError((error as Error).message);
							return;
						}

						//USEFUL FOR INTELLIJ: equivalent to window.postMessage().. this can be used in jsquery.inject javascirpt( window.postMessage( 'Data' )) 
						this.view?.webview.postMessage({type:"addEmptyBotMsg"});
						// console.log(prompt);
						const responseCallback = (response:string)=>{		
							this.view?.webview.postMessage({ type: 'BotMsgChunk' ,data:response});
						};
						
						const endCallback = ()=>{
							this.streamClient=undefined;	
							let webviewMsgApi = this.view?.webview.postMessage({ type: 'BotMsgEnd' });
						};
						
						const errorCallback = (error: string)=>{
							this.streamClient=undefined; 
							this.view?.webview.postMessage({ type: 'BotMsgError', error: error });
						};
						this.streamClient = getModelPredictionStream(prompt,responseCallback,endCallback,errorCallback);
						break;
					}
				case 'userInput':
					{
						this.handleUserInput(data.input);
						break;
					}
				case 'setStatusBarFetching':
					{
						updateStatusBarFetchingPrediction();
						break;
					}
				case 'setStatusBarActive':
					{
						updateStatusBarArtemusActive();
						break;
					}
				case 'cancelRequest':
					{
						this.streamClient?.cancel();
						this.streamClient = undefined;
						break;
					}
				case 'saveCurrentChat':
					{
						let chatHistory = await this.context.globalState.get("Artemus-Chat-State") as ChatHistory|undefined;
						let currentChatContext = data.context as ChatContext;
						let newChatHistory = this.updateChatHistory(chatHistory, currentChatContext);
						await this.context.globalState.update("Artemus-Chat-State", newChatHistory);
						this.view?.webview.postMessage({type: "stateSaved"});
						break;
					}
				case 'restoreChatById':
					{
						let chatHistory = this.context.globalState.get("Artemus-Chat-State") as ChatHistory|undefined;
						let chatIdToFind = data.chatId as string;
						let chatHistoryItem = chatHistory?.chatItems.find((chatHistoryItem) => {
							return chatHistoryItem.chatContext.chatId === chatIdToFind;
						});
						this.view?.webview.postMessage({
							type: "restoreChatContext",
							chatContext: chatHistoryItem?.chatContext
						});
						break;
					}
				case 'restoreLatestChat':
					{
						let chatHistory = this.context.globalState.get("Artemus-Chat-State") as ChatHistory|undefined;
						
						this.view?.webview.postMessage({
							type: "restoreChatContext",
							chatContext: chatHistory?.chatItems[0]?.chatContext
						});
						break;
					}
				case 'getChatHistory':
					{
						let chatHistory = this.context.globalState.get("Artemus-Chat-State") as ChatHistory|undefined;
						this.view?.webview.postMessage({
							type: "getChatHistory",
							chatHistory: chatHistory
						});
						break;
					}
				case 'showChatView':
					{
						vscode.commands.executeCommand("artemusai-vscode.currentChat");
						break;
					}
				case 'showHistoryView':
					{
						vscode.commands.executeCommand("artemusai-vscode.historyView");
						break;
					}
				case 'createNewChatHelper': 
					{
						this.view?.webview.postMessage({type: "createNewChatHelper"});
						break;
					}
				case 'deleteChatHistory':
					{
						let chatHistory = this.context.globalState.get("Artemus-Chat-State") as ChatHistory|undefined;

						if(!chatHistory){ 
							return;
						}

						let chatIdToDelete = data.chatIdDelete as string;
						
						if(chatIdToDelete){
							// deleting a single Chat Item.
							chatHistory.chatItems = chatHistory.chatItems.filter((item) => item.chatContext.chatId !== chatIdToDelete);
							if(chatHistory.chatItems.length!==0){
								await this.context.globalState.update("Artemus-Chat-State", chatHistory);
							}
							else{
								await this.context.globalState.update("Artemus-Chat-State", undefined);
							}
							this.showChatHistory();
							return;
						}

						// clearing entire chat history except current chat
						let chatIdToRetain = data.chatIdRetain as string;
						let chatHistoryItemRetain = chatHistory.chatItems.find((chatHistoryItem) => {
							return chatHistoryItem.chatContext.chatId === chatIdToRetain;
						});

						if(!chatHistoryItemRetain){
							await this.context.globalState.update("Artemus-Chat-State", undefined);
						}
						else {
							chatHistory.chatItems = [chatHistoryItemRetain];
							await this.context.globalState.update("Artemus-Chat-State", chatHistory);
						}
						this.showChatHistory();
						break;
					}
			}
		});
	}

	public async handleUserInput(inputText:string) {
		inputText = inputText.trim();
						
		if(inputText.charAt(0) === '/') {
			let command = inputText.split('\n')[0].trim();

			switch (command) {
				// all suppored commands go here. 
				case '/explain':
				case '/document':
				case '/test': {
					this.handlePredefinedCommand(inputText,command);
					break;
				}
				default: {
					this.adduserMessage(inputText);
					this.commandError(`**${command}** is not a recognized command.`);
					break;
				}
			}
		}
		else{
			// if there is code selection, bring it into the prompt.
			let editor = vscode.window.activeTextEditor;
			if(!editor){
				// Normal user conversation input
				this.adduserMessage(inputText);
				this.generateResponse();
				return;
			}
			let fileUri = editor!.document.uri.path;
			try{
				let startLine:number|undefined = editor.selection.start.line + 1;
				let endLine:number|undefined = editor.selection.end.line + 1;
				// if there's no selection then it's just a direct user prompt without editor selection
				if(!(startLine===endLine && editor.selection.isEmpty))
				{
					let filePath =  (startLine && endLine) ? `File: ${fileUri}#${startLine}-${endLine}` : `File: ${fileUri}`;
					let previewText = (await getCodePreview(filePath)).preview;
					inputText = inputText + '\n' + filePath.trim() + '\n' + previewText;					
				}
				this.adduserMessage(inputText);
				this.generateResponse();
			}
			catch (error){
				this.adduserMessage(inputText);
				this.commandError((error as Error).message);
			}
		}		
	}
	
	public async handlePredefinedCommand(inputText:string,command:string) {
		let filePath:string|undefined = inputText.split('\n')[1];
		if(filePath){
			filePath = filePath.trim();
			if(!this.validCommandFileFormat(filePath)){
				this.adduserMessage(inputText);
				this.commandError(`**${inputText}**\nis not a valid command.`);
				return;
			}
			try{
				let previewText =  (await getCodePreview(filePath)).preview;
				
				inputText = command + '\n' + filePath.trim() +'\n' + previewText;
				
				this.adduserMessage(inputText);
				this.generateResponse();
			}
			catch (error){
				this.adduserMessage(inputText);
				this.commandError((error as Error).message);
			}
		}
		else {
			let editor = vscode.window.activeTextEditor;
			if(!editor){
				this.adduserMessage(inputText);
				this.commandError(`Please select some code for **${command}** command.`);
				return;
			}
			let fileUri = editor.document.uri.path;
			try{
				let startLine:number|undefined = editor.selection.start.line + 1;
				let endLine:number|undefined = editor.selection.end.line + 1;
				// if there's no selection then use the whole file
				if(startLine===endLine && editor?.selection.isEmpty){
					startLine = undefined;
					endLine = undefined;
				}

				filePath =  (startLine && endLine) ? `File: ${fileUri}#${startLine}-${endLine}` : `File: ${fileUri}`;
				let previewText = (await getCodePreview(filePath)).preview;
				inputText = command + '\n' + filePath.trim() + '\n' + previewText;
				
				this.adduserMessage(inputText);
				this.generateResponse();
			}
			catch (error){
				this.adduserMessage(inputText);
				this.commandError((error as Error).message);
			}
		}
	}
	
	public validCommandFileFormat(filePath:string) {
		filePath = filePath.trim().split(" ")['0'];
		return filePath === "File:";
	}

	public adduserMessage(userMessage:string) {
		this.view?.webview.postMessage({
			type:"appendUserMessage",
			inputValue: userMessage
		});
	}

	public generateResponse() {
		this.view?.webview.postMessage({
			type:"generateResponse"
		});
	}

	public commandError(error:string) {
		this.view?.webview.postMessage({
			type:"commandError",
			message: error
		});
	}

	
	public updateChatHistory(chatHistory: ChatHistory|undefined, currentChatContext:ChatContext){
		if(chatHistory === undefined){
			return {
				chatItems:[
					{
						dateTime: new Date(),
						chatContext: currentChatContext
					}
				]
			};
		}
		let currentExists = false;
		let currentChatId = currentChatContext.chatId;
		let currentChat = currentChatContext.chat;
		// find the current chat in chatHistory.chats
		chatHistory.chatItems = chatHistory.chatItems.map((chatHistoryItem) => {
			if(chatHistoryItem.chatContext.chatId === currentChatId){
				currentExists = true;
				return {
					dateTime: new Date(),
					chatContext: currentChatContext
				} as ChatHistoryItem;
			}
			return chatHistoryItem;
		});
		if(!currentExists){
			chatHistory.chatItems = chatHistory.chatItems.concat({
				dateTime: new Date(),
				chatContext: currentChatContext
			});
		}
		return chatHistory;
	}

	public createNewChat() {
		this.view?.webview.postMessage({ type: 'createNewChat'});
	}

	public showChatHistory() {
		this.view?.webview.postMessage({ type: 'showChatHistory'});
	}
	
	public showCurrentChat() {
		this.view?.show();
		this.view?.webview.postMessage({ type: 'showCurrentChat'});
	}

	public executeCommand(command:string) {
		switch(command){
			case '/explain': {
				this.handleUserInput('/explain');
				break;
			}
			case '/document': {
				this.handleUserInput('/document');
				break;
			}
			case '/test': {
				this.handleUserInput('/test');
				break;
			}
			default: {
				console.error(`Error: Invalid Command ${command}`);
			}
		}
	}
	
	private _getHtmlForWebview(webview: vscode.Webview) {
		
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'artemusChatPanel.js'));
		const customCSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'artemusChatPanel.css'));
		
		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
		const highlightCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'github_dark.css'));
		
		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();
		
		return `<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<!--
							Use a content security policy to only allow loading images from https or from our extension directory,
							and only allow scripts that have a specific nonce.
						-->
						<meta http-equiv="Content-Security-Policy" content="img-src ${webview.cspSource} https: data:;
						style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<link href="${highlightCssUri}" rel="stylesheet">
						<link href="${styleResetUri}" rel="stylesheet">
						<link href="${customCSSUri}" rel="stylesheet">
						<link href="${styleMainUri}" rel="stylesheet">
						<script nonce=${nonce}>
							const vscodeApi = acquireVsCodeApi();
						</script>
					</head>
					<body>
						<script nonce="${nonce}" src="${scriptUri}"></script>
					</body>
				</html>`;
	}
}