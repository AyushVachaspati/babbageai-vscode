import * as vscode from "vscode";

export async function getCodePreview(filePath:string) {
    filePath = filePath.split(' ')[1];
    let fileUri = filePath.split('#')[0];
    let fileSplit = filePath.split('#');
    let rangeNumbers = fileSplit.length > 1 ? fileSplit[fileSplit.length-1] : undefined;
    let startLine:number|undefined = undefined;
    let endLine:number|undefined = undefined;
    if(rangeNumbers){
        startLine = rangeNumbers.split('-')[0] ? +rangeNumbers.split('-')[0] : NaN;
        endLine =  rangeNumbers.split('-')[1] ? +rangeNumbers.split('-')[1] : NaN;
    }

    try{
        const file = await vscode.workspace.openTextDocument(fileUri);
    
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
        return {
            preview:`\`\`\`${language}\n${previewText}\n\`\`\``,
            language:language
        };
    }
    catch {
        throw Error(`Could Not open\n**File: ${filePath}**\nPlease Check File Path and Range are correct.`);
    }
}
