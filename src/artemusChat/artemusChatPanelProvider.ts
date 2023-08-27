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
				case 'startGeneration':
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
						this.streamClient = getModelPredictionStream(data.prompt,responseCallback,endCallback,errorCallback);
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

	public handleUserInput(inputText:string) {
		inputText = inputText.trim();
						
		if(inputText.charAt(0) === '/') {
			let command = inputText.split('\n')[0].trim();

			switch (command) {
				// all suppored commands go here. 
				case '/explain':
				case '/document': {
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
		// Normal user conversation input
			this.adduserMessage(inputText);
			this.generateResponse();
		}		
	}
	public async handlePredefinedCommand(inputText:string,command:string) {
		let filePath:string|undefined = inputText.split('\n')[1];
		if(filePath){
			filePath = filePath.trim();
			if(!this.validFilePath(filePath)){
				this.adduserMessage(inputText);
				this.commandError(`**${inputText}**\nis not a valid command.`);
				return;
			}
			try{
				let fileUri = filePath.split(' ')[1].split('#')[0];
				let fileSplit = filePath.split('#');
				let rangeNumbers = fileSplit.length > 1 ? fileSplit[fileSplit.length-1] : undefined;
				let startLine:number|undefined = undefined;
				let endLine:number|undefined = undefined;
				if(rangeNumbers){
					startLine = rangeNumbers.split('-')[0] ? +rangeNumbers.split('-')[0] : NaN;
					endLine =  rangeNumbers.split('-')[1] ? +rangeNumbers.split('-')[1] : NaN;
				}

				let previewText = await this.getPreviewText(fileUri,startLine,endLine);
				inputText = command + '\n' +
				( (startLine && endLine) ? `File: ${fileUri}#${startLine}-${endLine}` : `File: ${fileUri}` ) +
				'\n' + previewText;
				
				this.adduserMessage(inputText);
				this.generateResponse();
			}
			catch{
				this.adduserMessage(inputText);
				this.commandError(`Could Not open\n**${filePath}**\nPlease Check File Path and Range are correct.`);
			}
		}
		else {
			let editor = vscode.window.activeTextEditor;
			if(!editor){
				this.adduserMessage(inputText);
				this.commandError(`Please select some code for **${command}** command.`);
				return;
			}
			try{
				let fileUri = editor.document.uri.path;
				let startLine:number|undefined = editor.selection.start.line + 1;
				let endLine:number|undefined = editor.selection.end.line + 1;
				if(startLine===endLine){
					startLine=undefined;
					endLine = undefined;
				}
				let previewText = await this.getPreviewText(fileUri,startLine,endLine);
				inputText = command + '\n' +
							( (startLine && endLine) ? `File: ${fileUri}#${startLine}-${endLine}` : `File: ${fileUri}` ) +
							'\n' + previewText;
				this.adduserMessage(inputText);
				this.generateResponse();
			}
			catch {
				this.adduserMessage(inputText);
				this.commandError(`Could Not open\n**${filePath}**\nPlease Check File Path and Range are correct.`);
			}
		}
	}
	
	public validFilePath(filePath:string) {
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

	public async getPreviewText(filePath:string, startLine:number|undefined, endLine:number|undefined) {
		if(Number.isNaN(startLine) || Number.isNaN(endLine)){
			throw Error(`Incorrect Range. Got ${startLine}, ${endLine}`);
		}

		const file = await vscode.workspace.openTextDocument(filePath);
		let language = file.languageId;
		let previewText:string;
		if(startLine!==undefined && endLine!==undefined){
			startLine--;
			endLine--;
			let firstLineRange = file.lineAt(startLine).range;
			let lastLineRange = file.lineAt(endLine).range;
			const selectionRange = new vscode.Range(firstLineRange.start, lastLineRange.end);
			previewText = file.getText(selectionRange);
		}
		else{
			previewText = file.getText();
		}
		// let previewLines = previewText.split('\n');
		// if(previewLines.length > 10){
		// 	previewText = previewLines.slice(0,5).join('\n') +"\n...\n"+ previewLines.slice(previewLines.length-5).join('\n');
		// }
		return `\`\`\`${language}\n${previewText}\n\`\`\``;
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