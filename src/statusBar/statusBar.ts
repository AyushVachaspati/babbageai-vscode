import * as vscode from 'vscode';

export let statusBarItem =  vscode.window.createStatusBarItem('artemus-status-bar',vscode.StatusBarAlignment.Left,-1);

export function updateStatusBarArtemusLoading(){
	statusBarItem.text = "Artemus Loading $(sync~spin)";
	statusBarItem.tooltip = "Loading Artemus";
	statusBarItem.show();
}

export function updateStatusBarArtemusActive(){
    // statusBarItem.text = "ArtemusAI Active $(rocket)";
	statusBarItem.text = "Artemus Active $(telescope)";
	statusBarItem.tooltip = "ArtemusAi Active!";
	statusBarItem.show();
}

export function updateStatusBarFetchingPrediction(){
    statusBarItem.text = "Artemus Fetching $(sync~spin)";
	statusBarItem.tooltip = "ArtemusAi Fetching Code Suggestions!";
	statusBarItem.show();
}

