import { Identity, type Message } from "../types/message";

export function constructPrompt(chat: Message[]): string {
    // append "put all code in markdown code block" to the end of all user inputs to make sure code is in blocks
    // Cody uses "Enclose code snippets with three backticks like so: ```"
    let prompt = "";
    chat.forEach( (message) => {
        let identity = message.identity;
        // need to handle commands and normal user messages. 
        // Also need to limit the number of tokens that are sent to the model server.
        switch(identity){
            case Identity.userMessage: {
                prompt += `<|user|>${message.message}<|end|>\n`;
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
    })
    return prompt+`<|assistant|>`;
}