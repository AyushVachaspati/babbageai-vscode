import * as vscode from "vscode";
import { getNonce } from "../utils/nonce";
import assert = require("assert");
import { debounceCompletions } from "../predictionUtils/callApi";

export class ArtemusChatPanelProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'artemusai-vscode.chatpanel';

	public view?: vscode.WebviewView;
    private doc?: vscode.TextDocument;

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
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case 'testMsg':
					{
						console.log(`Message Recived with ${data.anotherthing}`);
						break;
					}
				case 'userInput':
					{
						try{
							let prediction = await debounceCompletions(data.userInput);
							webviewView.webview.postMessage({type:"result","result":prediction?.result});
						}
						catch(error){
							console.error("Request to Artemus server failed.");
							webviewView.webview.postMessage({type:"result","result":"Sorry, The request to the server failed."});
						}
						break;
						
					}
			}
		});
	}

	public sendBotMsgChunk() {
		let webviewMsgApi = this.view?.webview;
		assert(webviewMsgApi, "Expected Webview to be defined");
		webviewMsgApi.postMessage({ type: 'sendBotMsgChunk' });
		
	}

	public sendBotMsgEnd() {
		let webviewMsgApi = this.view?.webview;
		assert(webviewMsgApi, "Expected Webview to be defined");
		webviewMsgApi.postMessage({ type: 'sendBotMsgEnd' });
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'artemusChatPanel.js'));
		const customCSSUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'artemusChatPanel.css'));
		
		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
		const highlightCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'syntax_highlight.css'));
		
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