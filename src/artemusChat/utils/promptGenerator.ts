import { Identity, type Message } from "../webviews/types/message";
import { getCodePreview } from "./getCodePreview";

export async function constructPrompt(chat: Message[]): Promise<string> {
    let lastUserMsg = chat[chat.length-1];
    let prompt = "";
    
    let lastMsgInputText = lastUserMsg.message.trim();
	if(lastMsgInputText.charAt(0) === '/') {
        // if the last user message is a command, only use that message as context
        // Assumed that command is valid. Validation done by caller of this function.
        let command = lastMsgInputText.split('\n')[0].trim();
        let filePath = lastMsgInputText.split('\n')[1].trim();
        switch(command){
            case "/explain":{
                let preview = await getCodePreview(filePath);
                let codeSnippet = preview.preview;
                let language = preview.language;
                let promptPrefix = `Explain the following ${language} code. Be very detailed and specific, and indicate when it is not clear to you what is going on. Format your response as an ordered list. Finally summarize your explanations at the end.\n`;
                let promptSuffix  = "Enclose code snippets with three backticks like so: ```";
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                prompt = `<|user|>${prompt}<|end|>\n`;
                break;
            }
            case "/document":{
                let preview = await getCodePreview(filePath);
                let codeSnippet = preview.preview;
                let language = preview.language;
                let promptPrefix = `Generate a comment to document the parameters and functionality of the following ${language} code\n`;
                let promptSuffix  = `Use the ${language} documentation style to generate a ${language} comment. Only generate documentation, do not generate code.\nEnclose code snippets with three backticks like so: \`\`\``;
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                prompt = `<|user|>${prompt}<|end|>\n`;
                break;
            }
            default:{
                throw Error(`**${lastMsgInputText}** is not a valid command.`);
                break;
            }
        }
    }
    else {
        //otherwise use the entire conversation as context
        chat.forEach( (message) => {
            switch(message.identity){
                case Identity.userMessage: {
                    if(message.message.charAt(0)==="/"){
                        let command = message.message.split('\n')[0].trim();
                        let filePath = message.message.split('\n')[1].trim();
                        prompt += `<|user|>${command}\n${filePath}<|end|>\n`;
                    }
                    else{
                        let promptSuffix  = "Enclose any code snippets with three backticks like so: ```";
                        prompt += `<|user|>${message.message}\n${promptSuffix}<|end|>\n`;
                    }
                    break;
                }
                case Identity.botMessage: {
                    prompt += `<|assistant|>${message.message}<|end|>\n`;
                    break;
                }
                case Identity.errorMessage: {
                    break;

                }
            }
        });
    }
    return prompt+`<|assistant|>`;
}