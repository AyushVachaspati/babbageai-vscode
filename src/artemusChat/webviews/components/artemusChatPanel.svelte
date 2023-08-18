<script lang="ts">
    import { onMount } from "svelte";
	import MessageBox from "./MessageBox.svelte";
	import Send from "../icons/send.svelte";
	import { Identity, type Message } from "../types/message";
    import { tick } from "svelte/internal";
	import CopyCodeButton from "./copyCodeButton.svelte";
    import InsertCodeButton from "./insertCodeButton.svelte";
	import StopGenerateButton from "./stopGenerateButton.svelte";

	let fetching=false;
	let inputTextArea:any;
	let outputArea:any;
	let blink = false;
	let chat:Message[] = [];
	let loading =true;
	let inputValue = '';
	let disabled = true;
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
		loading = false;
		await tick();
		inputTextArea.focus();

		window.addEventListener("message",async (event) => {
			const message = event.data;
			switch(message.type){
				case "BotMsgChunk":{						
					let temp = chat.pop();
					if(temp){
						temp.message = temp.message + message.data;
						chat = chat.concat(temp);
						await scrollToBottom(outputArea);
						addCodeBlockButtons();
					}
					chat = chat;
					break;
				}
				case "BotMsgEnd":{
					fetching = false;
					vscodeApi.postMessage({type:'setStatusBarActive'});
					await scrollToBottom(outputArea);
					addCodeBlockButtons();
					inputTextArea.focus();
					break;
				}
				case "BotMsgError":{
					handleErrors(message);
					break;
				}
			}

		})

	});

	async function handleErrors(message:any) {
		let error_code = (message.error as string).split(" ")[0];
		let temp = chat.pop();
		if(temp && temp.message!==""){
			chat = chat.concat(temp);
		}
		fetching = false;
		vscodeApi.postMessage({type:'setStatusBarActive'});
		inputTextArea.focus();
		await scrollToBottom(outputArea);
		addCodeBlockButtons();
		
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
	}


	function resizeInputArea() {
		let element = document.getElementsByClassName('input-area')[0] as HTMLElement;
		element.style.height = 'auto';
		element.style.height = element.scrollHeight - 15 + 'px';  // 10 is a ad hoc constant to make the intial text area correct
	}
	
	async function sendUserMessage() {
		fetching=true;
		chat = chat.concat({identity: Identity.userMessage, message: inputValue})
		chat = chat.concat({identity: Identity.botMessage, message: ""})
		vscodeApi.postMessage({type:'setStatusBarLoading'});
		vscodeApi.postMessage({type:'userInput',userInput:inputValue});
		inputValue="";
		inputTextArea.focus();

		await scrollToBottom(outputArea);
		addCodeBlockButtons();
		resizeInputArea();
	}

	function addCodeBlockButtons() {
		let preComponents = Array.from(document.getElementsByClassName('code-block'));
		// console.log(preComponents)
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
		node.scroll({ top: node.scrollHeight, behavior: 'instant' });
  	}; 

</script>





{#if loading}
	<div class="center">
		<div class="loader"></div>
	</div> 
{:else}
	<div class="flex-container">
		<div bind:this={outputArea} class='output-area'>
		<MessageBox {chat} {blink} ></MessageBox>
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