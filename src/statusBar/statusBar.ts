import * as vscode from 'vscode';

export let statusBarItem =  vscode.window.createStatusBarItem('babbage-status-bar',vscode.StatusBarAlignment.Left,-1);

export function updateStatusBarBabbageLoading(){
	statusBarItem.text = "BabbageAI Loading $(sync~spin)";
	statusBarItem.tooltip = "Loading BabbageAI";
	statusBarItem.show();
}

export function updateStatusBarBabbageActive(){
    statusBarItem.text = "BabbageAI Active $(rocket)";
	// statusBarItem.text = "BabbageAI Active $(telescope)";
	statusBarItem.tooltip = "BabbageAi Active!";
	statusBarItem.show();
}

export function updateStatusBarFetchingPrediction(){
    statusBarItem.text = "BabbageAI Fetching $(sync~spin)";
	statusBarItem.tooltip = "BabbageAi Fetching Code Suggestions!";
	statusBarItem.show();
}

