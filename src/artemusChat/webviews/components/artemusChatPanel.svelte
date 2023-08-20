<script lang="ts">
    import { onMount } from "svelte";
	import MessageBox from "./MessageBox.svelte";
	import Send from "../icons/send.svelte";
	import { Identity, type Message } from "../types/message";
    import { prevent_default, tick } from "svelte/internal";
	import CopyCodeButton from "./copyCodeButton.svelte";
    import InsertCodeButton from "./insertCodeButton.svelte";
	import StopGenerateButton from "./stopGenerateButton.svelte";
	import { v4 as uuidv4} from "uuid";
	import type { ChatContext } from "../types/state";

	let chatContext: ChatContext;
	let chatId = uuidv4();
	let stateLock = false;
	let fetching=false;
	let inputTextArea:any;
	let outputArea:any;
	let chat:Message[] = [];
	let loading =true;
	let inputValue = '';
	let disabled = true;
	let scrollLock = true;
	$: disabled = (!fetching && inputValue.trim())? false: true;
	
	function keypress(event:any){
		if(event.shiftKey)
			return;
		if(event.keyCode===13){	
			event.preventDefault();
			if(disabled) return;
			sendUserMessage();
		}
	}

	onMount(async () => {
		// restore the latest conversation
		vscodeApi.postMessage({type:'restoreLatestChat'});
		//
		loading = false;
		await tick();
		inputTextArea.focus();

		window.addEventListener("message",async (event) => {
			const data = event.data;
			switch(data.type){
				case "BotMsgChunk":{						
					let temp = chat.pop();
					if(temp){
						temp.message = temp.message + data.data;
						chat = chat.concat(temp);
						await scrollToBottom(outputArea);
						addCodeBlockButtons();
					}
					chat = chat;
					saveCurrentChat();
					break;
				}
				case "BotMsgEnd":{
					fetching = false;
					vscodeApi.postMessage({type:'setStatusBarActive'});
					await scrollToBottom(outputArea);
					addCodeBlockButtons();
					inputTextArea.focus();
					// Probably a bad idea! Wait 100ms before saving final state (so that stateLock is released, should switch to wait until unlocked)
					await new Promise(res => setTimeout(res, 100));
					saveCurrentChat();
					break;
				}
				case "BotMsgError":{
					await handleErrors(data);
					// Probably a bad idea! Wait 100ms before saving final state (so that stateLock is released, should switch to wait until unlocked)
					await new Promise(res => setTimeout(res, 100));
					saveCurrentChat();
					break;
				}
				case 'stateSaved':{
					stateLock = false;
					break;
				}
				case 'restoreLatestChatContext':{
					chatContext = data.latestChat as ChatContext;
					chat = chatContext.chat;
					chatId = chatContext.chatId;
					break;
				}
			}

		})

	});

	async function handleErrors(message:any) {
		console.error(message)
		let error_code = (message.error as string).split(" ")[0];
		let temp = chat.pop();
		if(temp && temp.message!==""){
			chat = chat.concat(temp);
		}
		fetching = false;
		vscodeApi.postMessage({type:'setStatusBarActive'});
		
		switch(error_code){
			case '1': {
				chat = chat
				break;
			}
			default: {
				chat = chat.concat({identity: Identity.errorMessage, 
									message: "An Error Occured while fetching Responses."})
				break;
			}
		}
		inputTextArea.focus();
		await scrollToBottom(outputArea);
		addCodeBlockButtons();
		resizeInputArea();
	}


	function resizeInputArea() {
		let element = document.getElementsByClassName('input-area')[0] as HTMLElement;
		element.style.height = 'auto';
		element.style.height = element.scrollHeight - 15 + 'px';  // 10 is a ad hoc constant to make the intial text area correct
	}

	
    function constructPrompt(chat: Message[]): string {
		// append "put all code in markdown code block" to the end of all user inputs to make sure code is in blocks
        let prompt = "";
		chat.forEach( (message) => {
			let identity = message.identity;
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

	async function sendUserMessage() {
		
		fetching=true;
		
		// Remove Error message if present
		let temp = chat.pop()
		if(temp && temp.identity !== Identity.errorMessage)
			chat = chat.concat(temp)

		chat = chat.concat({identity: Identity.userMessage, message: inputValue})
		let prompt:string = constructPrompt(chat);

		vscodeApi.postMessage({type:'setStatusBarFetching'});
		chat = chat.concat({identity: Identity.botMessage, message: ""})
		vscodeApi.postMessage({type:'userInput',userInput:prompt});
		
		inputValue="";
		inputTextArea.focus();
		await scrollToBottom(outputArea);
		addCodeBlockButtons();
		resizeInputArea();
	}

	async function regenerateResponse() {		
		fetching=true;
		chat.pop(); //remove the error message
		let temp = chat.pop();
		// if the error occured while generating.. remove the incomplete response
		if(temp && temp.identity !== Identity.botMessage)
			chat = chat.concat(temp)
		chat = chat;
		let prompt:string = constructPrompt(chat);
		vscodeApi.postMessage({type:'setStatusBarFetching'});
		chat = chat.concat({identity: Identity.botMessage, message: ""})
		vscodeApi.postMessage({type:'userInput',userInput:prompt});
		
		inputTextArea.focus();
		await scrollToBottom(outputArea);
		addCodeBlockButtons();
		resizeInputArea();
	}

	async function saveCurrentChat(){
		if(stateLock){
			return;
		}
		stateLock = true;
		await vscodeApi.postMessage({
			type:'saveCurrentChat',
			state: {
				chatId: chatId,
				chat: chat
			} as ChatContext
		});
	}

	function addCodeBlockButtons() {
		let preComponents = Array.from(document.getElementsByClassName('code-block'));
		preComponents.forEach((preComponent) => {
			let hasButtons = preComponent.parentElement?.getElementsByClassName("copy-code-button").length 
							|| preComponent.parentElement?.getElementsByClassName("copy-code-button-small").length;
			if(!hasButtons){
				let copyButton = new CopyCodeButton({
					target: preComponent.parentElement as HTMLElement
				});
				let insertButton = new InsertCodeButton({
					target: preComponent.parentElement as HTMLElement
				});
			}
			
		})
	}

	async function scrollToBottom(node:any) {
		await tick();
		let currentScroll = node.scrollTop;
		let lockThreshold = 30;
		if(scrollLock){
			node.scroll({ top: node.scrollHeight, behavior: 'instant' });
			let difference = Math.abs(node.scrollTop - currentScroll);
			if(difference > lockThreshold)
				scrollLock = false;
		}
		else{
			node.scroll({ top: node.scrollHeight, behavior: 'instant' });
			let difference = Math.abs(node.scrollTop - currentScroll);
			if(difference < lockThreshold)
				scrollLock = true;
			node.scroll({ top: currentScroll, behavior: 'instant' })
		}
  	}; 



</script>





{#if loading}
	<div class="center">
		<div class="loader"></div>
	</div> 
{:else}
	<div class="flex-container">
		<div bind:this={outputArea} class='output-area'>
		<MessageBox {chat} on:click = {regenerateResponse} ></MessageBox>
		</div>
		<div class="chat-container">
			<div class="textarea-container">
			{#if fetching}
				<StopGenerateButton />
			{/if}
			<form>
				<textarea bind:this={inputTextArea} class='input-area' placeholder="" bind:value={inputValue} on:input={resizeInputArea} on:keypress={keypress} />
				<button type='submit' class="send-button" {disabled} on:click|preventDefault={sendUserMessage}><Send /></button>
			</form>
			</div>
		</div>
		<!-- <div><p>Current Open File Goes Here </p></div> -->
		<!-- <br> -->
	</div>
{/if}




<style>
	/* width */
	::-webkit-scrollbar {
		width: 6px;
	}

	/* Track */
	::-webkit-scrollbar-track {
		background: transparent;
	}

	/* Handle */
	::-webkit-scrollbar-thumb {
		background: #888;
	}

	/* Handle on hover */
	::-webkit-scrollbar-thumb:hover {
		background: #555;
	}

	.chat-container {
		position: -webkit-sticky; /* Safari */
		position: sticky;
	}

	.textarea-container {
		margin: 10px 25px 10px 10px;
		position: relative;
	}

	.send-button {
		background-color: rgba(134, 134, 134, 0.708);
		border: None;
		position: absolute;
		bottom: 10px;
		right: 10px;
		padding: 5px;
		border-radius: 5px;	
	}
	.send-button:focus {
		outline: none;
		border: 1px solid rgb(255,255,255,.3);
	}

	.send-button:hover:not([disabled])  {
		cursor: pointer;
		transform: scale(0.95);
		opacity: 0.9;
	}

	button:disabled{
		background-color: transparent;
		cursor: auto;
	}
	.output-area{
		height: 100vh;
		overflow-y: scroll;
		margin: 10px;
	}
	.input-area{
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgb(50,50,50,0.3);
		padding: 14px 40px 10px 20px;
		resize: none;
		overflow-y: scroll;
		height: 3em;
		min-height: 3em;
		max-height: 10em;
		width: 100%;
		color: whitesmoke;
		font-family: 'Courier New', Courier, monospace;
		font-size: medium;
	}
	.input-area:focus{
		border: 1px solid rgba(255, 255, 255, 1);
	}

	::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
		color: gray;
		opacity: 1; /* Firefox */
	}

	.input-area:focus{
		outline: none;
	}

	.flex-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}


	.center {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	.loader {
		border: 5px solid #f3f3f3; 
		border-top: 5px solid gray; 
		border-radius: 100%;
		width: 30px;
		height: 30px;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

</style>