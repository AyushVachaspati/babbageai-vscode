import { readFile } from "fs";
import { Identity, type Message } from "../webviews/types/message";
import { getCodePreview } from "./getCodePreview";
import { readFileSync } from "fs";

type OpenAIItem = {
    role: string;
    content: string;
};


export async function constructChatPrompt(chat: Message[]): Promise<OpenAIItem[]> {
    let lastUserMsg = chat[chat.length-1];
    const systemPrompt = readFileSync("./system_prompt.txt", 'utf-8');
    let prompt = "";
    let output: OpenAIItem[] = [];
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
                let promptPrefix = `Explain the following ${language} code. Indicate when it is not clear to you what is going on. Format your response as an ordered list. Finally summarize your explanations at the end.\n`;
                let promptSuffix  = "Put all code in markdown code blocks using ```";
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                output = [{"role":"system", "content": systemPrompt},
                          {"role":"user", "content": prompt}];
                break;
            }
            case "/document":{
                let preview = await getCodePreview(filePath);
                let codeSnippet = preview.preview;
                let language = preview.language;
                let promptPrefix = `Generate a comment to document the parameters and functionality of the following ${language} code\n`;
                let promptSuffix  = `Use the ${language} documentation style to generate a ${language} comment. Only generate documentation, do not generate code.\nPut everything in markdown code blocks using \`\`\``;
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                output = [{"role":"system", "content": systemPrompt},
                          {"role":"user", "content": prompt}];
                break;
            }
            case "/test":{
                let preview = await getCodePreview(filePath);
                let codeSnippet = preview.preview;
                let language = preview.language;
                let promptPrefix = `Generate unit tests for the following ${language} code\n`;
                let promptSuffix  = `Only generate tests and take care of all edge cases.\nPut everything in markdown code blocks using \`\`\``;
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                output = [{"role":"system", "content": systemPrompt},
                          {"role":"user", "content": prompt}];
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
                        output.push({
                            "role":"user",
                            "content": `${command}\n${filePath}`
                        });
                    }
                    else{
                        let promptSuffix  = "Put all code in markdown code blocks using ```";
                        output.push({
                            "role":"user",
                            "content": `${message.message}\n${promptSuffix}`
                        });
                    }
                    break;
                }
                case Identity.botMessage: {
                    output.push({
                        "role":"assistant",
                        "content": `${message.message}`
                    });
                    break;
                }
                case Identity.errorMessage: {
                    break;

                }
            }
        });
    }
    return output;
}