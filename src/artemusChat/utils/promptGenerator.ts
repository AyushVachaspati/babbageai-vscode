import { readFile } from "fs";
import { Identity, type Message } from "../webviews/types/message";
import { getCodePreview } from "./getCodePreview";
import { readFileSync } from "fs";
import { systemPrompt } from "./system_prompt";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources";


function validatePromptLength(messages:ChatCompletionMessageParam[]):ChatCompletionMessageParam[] {
    let output:ChatCompletionMessageParam[] = [];
    const sysPrompt = messages[0];
    let totalChars = messages[0].content!.length;
    const maxChars = 1000*10;

    messages = messages.slice(1);
    // loop through the array in reverse
    for (let i = messages.length - 1; i >= 0 && totalChars<=maxChars; --i) {
        output.push(messages[i]);
        totalChars += messages[i].content!.length;
    }
    if(output[output.length - 1].role === "assistant"){
        output.push({"role":"user", "content":""});  // prompt has to be user/assistant/user/assistant
    }
    output.push(sysPrompt);
    output = output.reverse();
    return output;
}


export async function constructChatPrompt(chat: Message[]): Promise<ChatCompletionMessageParam[]> {
    let lastUserMsg = chat[chat.length-1];
    let prompt = "";
    let output: ChatCompletionMessageParam[] = [{"role":"system", "content": systemPrompt}];
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
                let promptPrefix = `Explain the following ${language} codeBe clear and concise in your explanation. Format your response as an ordered list. Finally summarize your explanations at the end.\n`;
                let promptSuffix  = "Format all code in markdown code blocks using ```";
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                output.push({"role":"user", "content": prompt});
                break;
            }
            case "/document":{
                let preview = await getCodePreview(filePath);
                let codeSnippet = preview.preview;
                let language = preview.language;
                let promptPrefix = `Re-write the ${language} code with a docstring included to document the code.\nUse the ${language} documentation style. Format the output in markdown code block.`;
                let promptSuffix  = `Format all code in markdown code blocks using \`\`\``;
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                output.push({"role":"user", "content": prompt});
                break;
            }
            case "/test":{
                let preview = await getCodePreview(filePath);
                let codeSnippet = preview.preview;
                let language = preview.language;
                let promptPrefix = `Generate unit tests for the following ${language} code.\nOnly write tests and take care of all edge cases.\nFormat the output in markdown code block.`;
                let promptSuffix  = `Format all code in markdown code blocks using \`\`\``;
                prompt += `${promptPrefix}${codeSnippet}\n${promptSuffix}`;
                output.push({"role":"user", "content": prompt});
                break;
            }
            default:{
                throw Error(`**${lastMsgInputText}** is not a recognized command.`);
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
                        let promptSuffix  = "It is absolutely imperitive that you format all code in markdown code blocks using ```";
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
    output = validatePromptLength(output);
    return output;
}