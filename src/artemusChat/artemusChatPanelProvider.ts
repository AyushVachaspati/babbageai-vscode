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
				case 'insertCode':
					{
						let code = data.code;
						let editor = vscode.window.activeTextEditor;
						if(!editor){ break; }
						let selections = editor.selections;
						editor.edit((editBuilder) => {
							selections.forEach((selection) => {
								editBuilder.replace(selection, code);
							});
						});
						break;
					}
				case 'userInput':
					{
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
						this.streamClient = getModelPredictionStream(data.userInput,responseCallback,endCallback,errorCallback);
						break;
					}
				case 'userCommand':
					{
						let inputTxt:string = data.input.trim();
						
						if(inputTxt.charAt(0) === '/') {
						// try to use a predefined command
							let command = inputTxt.split('\n')[0].trim();
							switch (command) {
								// all suppored commands go here. 
								case '/explain':
								case '/document': {
									let input = inputTxt.split('\n').slice(1).join('\n');
									if(!input){
										let highlightedCode  =  this.getHighlightedCode();
										if(!highlightedCode){
											this.adduserMessage(inputTxt);
											this.commandError(`Please select some code for **${command}** command.`);
											break;
										}
										inputTxt = command + '\n' + highlightedCode;
									}
									this.adduserMessage(inputTxt);
									this.generateResponse(); //prompt construction based on command will be handle by prompt generator
									break;
								}
								default: {
									this.adduserMessage(inputTxt);
									this.commandError(`**${command}** is not a recognized command.`);
									break;
								}
							}
						}
						else{
						// Normal user conversation input
							this.adduserMessage(inputTxt);
							this.generateResponse();
						}

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
						//get latest chat from the Artemus plugin state and return ChatContext
						// state is ChatContext[]
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
				case 'deleteChatHistory':
					{
						let chatHistory = this.context.globalState.get("Artemus-Chat-State") as ChatHistory|undefined;
						
						if(!chatHistory){ return;}

						let chatIdToFind = data.chatId as string;
						let chatHistoryItem = chatHistory.chatItems.find((chatHistoryItem) => {
							return chatHistoryItem.chatContext.chatId === chatIdToFind;
						});

						if(!chatHistoryItem){
							await this.context.globalState.update("Artemus-Chat-State", undefined);
						}
						else {
							chatHistory.chatItems = [chatHistoryItem];
							await this.context.globalState.update("Artemus-Chat-State", chatHistory);
						}
						this.showChatHistory();
						break;
					}
			}
		});
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

	public getHighlightedCode() {
		const editor = vscode.window.activeTextEditor;
		if(!editor){
			return undefined;
		}
		const selection = editor.selection;
		let language = editor.document.languageId;
		console.log(language);
		if (!selection.isEmpty) {
			let firstLineRange = editor.document.lineAt(selection.start.line).range;
			let lastLineRange = editor.document.lineAt(selection.end.line).range;
			const selectionRange = new vscode.Range(firstLineRange.start, lastLineRange.end);
			const highlighted = editor.document.getText(selectionRange);
			return `\`\`\`${language}\n${highlighted}\n\`\`\``;
		}
		else {
			return undefined;
		}
	}

	public updateChatHistory(chatHistory: ChatHistory|undefined, currentChatContext:ChatContext){
		if(chatHistory === undefined){
			console.log("returning new Chat history");
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
		this.view?.webview.postMessage({ type: 'showCurrentChat'});
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