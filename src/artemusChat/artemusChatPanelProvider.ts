import * as vscode from "vscode";
import { getNonce } from "./utils/nonce";
import assert = require("assert");
import { debounceCompletions } from "../predictionUtils/inlineCompletionAPI";
import { getModelPredictionStream } from "../predictionUtils/chatResponseAPI";
import { updateStatusBarArtemusActive, updateStatusBarArtemusLoading } from "../statusBar/statusBar";
import { ModelStreamInferResponse__Output } from "../predictionUtils/tritonGrpc/generated/inference/ModelStreamInferResponse";
import { ModelInferRequest } from "../predictionUtils/tritonGrpc/generated/inference/ModelInferRequest";
import { ClientDuplexStream } from "@grpc/grpc-js";

export class ArtemusChatPanelProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'artemusai-vscode.chatpanel';

	public view?: vscode.WebviewView;
    private doc?: vscode.TextDocument;
	private streamClient: ClientDuplexStream<ModelInferRequest, ModelStreamInferResponse__Output> | undefined;

	constructor(private readonly _extensionUri: vscode.Uri) {}

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
			console.log(event);console.log("Disposed");
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
							this.sendBotMsgChunk(response);
						};
						
						const endCallback = ()=>{
							this.sendBotMsgEnd();
						};
						
						const errorCallback = (error: string)=>{
							this.sendBotMsgError(error);
						};
						this.streamClient = getModelPredictionStream(data.userInput,responseCallback,endCallback,errorCallback);
						break;
					}
				case 'setStatusBarLoading':
					{
						updateStatusBarArtemusLoading();
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
			}
		});
	}

	public sendBotMsgChunk(response:string) {
		let webviewMsgApi = this.view?.webview;
		assert(webviewMsgApi, "Expected Webview to be defined");
		webviewMsgApi.postMessage({ type: 'BotMsgChunk' ,data:response});
		
	}

	public sendBotMsgEnd() {
		let webviewMsgApi = this.view?.webview;
		assert(webviewMsgApi, "Expected Webview to be defined");
		webviewMsgApi.postMessage({ type: 'BotMsgEnd' });
	}

	public sendBotMsgError(error:string) {
		let webviewMsgApi = this.view?.webview;
		assert(webviewMsgApi, "Expected Webview to be defined");
		webviewMsgApi.postMessage({ type: 'BotMsgError', error: error });
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