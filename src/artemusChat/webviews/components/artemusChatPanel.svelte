<script lang="ts">
    import { onMount } from "svelte";
	import MessageBox from "./MessageBox.svelte";
	import Send from "./send.svelte";
	import { Identity, type Message } from "../types/message";
    import { tick } from "svelte/internal";
	
	let inputTextArea:any;
	let outputArea:any;
	let blink = false;
	let chat:Message[] = [];
	let loading =true;
	let inputValue = '';
	let disabled = true;
	$: disabled = inputValue.trim()? false: true;

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
		await new Promise(resolve => setTimeout(resolve, 200));
		loading = false;
		await tick();
		inputTextArea.focus();

		window.addEventListener("message", (event) => {
			const message = event.data;
			switch(message.type){
				case "sendBotMsgChunk":
					console.log("Chunk recieved");
					break;
				case "sendBotMsgEnd":
					console.log("Message Ended");
					break;
				case "result":
					console.log(message.result);
					chat = chat.concat({identity: Identity.Bot, message: message.result});
					scrollToBottom(outputArea);
					break;
			}

		})

	});

	function handleInput(event:any) {
	}
	
	async function sendUserMessage() {
		vscodeApi.postMessage({type:'userInput',userInput:inputValue});
		chat = chat.concat({identity: Identity.User, message: inputValue})
		inputValue="";
		inputTextArea.focus();
		scrollToBottom(outputArea);
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
			<form>
				<textarea bind:this={inputTextArea} class='input-area' placeholder="" bind:value={inputValue} on:input={handleInput} on:keypress={keypress} />
				<button type='submit' class="send-button" {disabled} on:click|preventDefault={sendUserMessage}><Send /></button>
			</form>
			</div>
			<!-- svelte-ignore missing-declaration -->
			<!-- <button on:click={()=>{
				vscodeApi.postMessage({type:'testMsg', value:'Nice Test',anotherthing:'this works'});
			}}>
			Click to post message to VscodeAPI
			</button> -->
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
		background-color: rgb(34, 89, 126);
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
		background: rgb(50,50,50);
		padding: 14px 40px 10px 20px;
		resize: none;
		overflow-y: scrollbar;
		height: 3em;
		min-height: 3em;
		max-height: 15em;
		width: 100%;
		color: whitesmoke;
		font-family: 'Courier New', Courier, monospace;
		font-size: medium;
		border: none;
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