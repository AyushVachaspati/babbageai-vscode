<script lang="ts">
    import { onMount } from "svelte";
	import MessageBox from "./MessageBox.svelte";
	import Send from "../icons/send.svelte";
	import { Identity, type Message } from "../types/message";
    import { compute_rest_props, tick } from "svelte/internal";
	import CopyCodeButton from "./copyCodeButton.svelte";
    import InsertCodeButton from "./insertCodeButton.svelte";
	import StopGenerateButton from "./stopGenerateButton.svelte";
	import { v4 as uuidv4} from "uuid";
	import type { ChatContext, ChatHistory, ChatHistoryItem } from "../types/chatState";
    import ClearHistoryButton from "./clearHistoryButton.svelte";
    import HistoryCard from "./historyCard.svelte";
    import CommandPalette from "./commandPalette.svelte";
	import SelectionInfo from "./selectionInfo.svelte";	
	import DeleteConfirmDialog from "./deleteConfirmDialog.svelte";
	
	let currentView = 'ChatView';
	let chatContext: ChatContext|undefined;
	let chatHistory: ChatHistory|undefined;

	let shouldSaveCurrentChat = false;
	let saveLock = false;
	autoSave();

	let confirmDialogDisplay=false;
	let hasSelection = false;
	let selection = "";
	let fetching=false;
	let inputTextArea:any;
	let outputArea:any;
	let currentChatId = uuidv4();
	let initalMessage = [{identity:Identity.botMessage, message:"Hi, I'm Artemus. How can I Help you today?"}];
	let chat:Message[] = [];
	let chatDisplay:Message[];
	$: chatDisplay = initalMessage.concat(chat);
	let loading = true;
	let inputValue = '';
	let disabled = true;
	let scrollLock = true;
	$: disabled = (!fetching && inputValue.trim())? false: true;

	let commandsList:string[] = ["/explain","/document","/test"]
	$: commands = commandsList.filter((value) => {
			highlightIndex=0;
			return value.startsWith(inputValue.trimStart()) &&
			value !== inputValue.trimStart()
		}
	)

	$: showCommandPalette = inputValue.trimStart().charAt(0) === '/' ? true: false;
	let highlightIndex = 0;

	const commandHandler = (event:MouseEvent) => {
        let button = event.target as HTMLButtonElement;
        inputValue = button.innerText;
		inputTextArea.focus();
    }

	function switchCommand(event:KeyboardEvent) {
		if(event.key === 'ArrowUp'){
			highlightIndex = (highlightIndex + (commands.length - 1)) % commands.length;
		}
		if(event.key === 'ArrowDown'){
			highlightIndex = (highlightIndex + 1) % commands.length;
		}
	}

	function sortChatDescending(chat1:ChatHistoryItem,chat2:ChatHistoryItem){
		return (new Date(chat2.dateTime)).getTime() - (new Date(chat1.dateTime)).getTime()
	}

	function getLastUserMessage(chat:Message[]){
		let msg = chat.slice().reverse().find(msg => msg.identity===Identity.userMessage);
		return msg ? msg.message : "Error Loading Last User Msg";
	}

	function inputAreaKeypress(event:KeyboardEvent){
		if(event.shiftKey)
			return;
		if(event.key==="Enter"){	
			event.preventDefault();
			if(disabled) return;
			sendUserMessage();
		}
	}

	onMount(async () => {
		// TODO: Should I restore latest chat on reload or Start a new Chat on reload.
		// vscodeApi.postMessage({type:'restoreLatestChat'});
		loading = false;
		await tick();
		inputTextArea?.focus();

		window.addEventListener("message",async (event) => {
			const data = event.data;
			switch(data.type){
				case "appendUserMessage":{			
					chat = chat.concat({identity: Identity.userMessage, message: data.inputValue});
					inputTextArea?.focus();
					await scrollToBottom(outputArea,true);
					addCodeBlockButtons();
					resizeInputArea();
					saveCurrentChat();
					break;
				}
				case "generateResponse":{						
					generateResponse();
					break;
				}
				case "addEmptyBotMsg":{
					chat = chat.concat({identity: Identity.botMessage, message: ""});
					break;
				}
				case "BotMsgChunk":{						
					let temp = chat.pop();
					if(temp){
						temp.message = temp.message + data.data;
						chat = chat.concat(temp);
						await scrollToBottom(outputArea,false);
						addCodeBlockButtons();
					}
					chat = chat;
					saveCurrentChat();
					break;
				}
				case "BotMsgEnd":{
					setFetching(false);
					vscodeApi.postMessage({type:'setStatusBarActive'});
					await scrollToBottom(outputArea,false);
					addCodeBlockButtons();
					// inputTextArea?.focus();
					saveCurrentChat();
					break;
				}
				case "BotMsgError":{
					await handleErrors(data);
					saveCurrentChat();
					break;
				}
				case "commandError":{
					handleCommandErrors(data);
					saveCurrentChat();
					break;
				}
				case 'stateSaved':{
					saveLock = false;
					break;
				}
				case 'restoreChatContext':{
					chatContext = data.chatContext as ChatContext|undefined;
					if(chatContext){
						chat = chatContext.chat;
						currentChatId = chatContext.chatId;
					}
					break;
				}
				case 'getChatHistory':{
					chatHistory = data.chatHistory as ChatHistory|undefined;
					break;
				}
				case 'createNewChat':{
					saveCurrentChat();
				    vscodeApi.postMessage({type:'cancelRequest'});
					vscodeApi.postMessage({type:'createNewChatHelper'})
					break;
				}
				case 'createNewChatHelper':{
					chat = [];
					currentChatId = uuidv4();
					shouldSaveCurrentChat = false;
					vscodeApi.postMessage({type:'showChatView'});
					await tick();
					inputTextArea?.focus();
					break;
				}
				case 'showChatHistory':{
					vscodeApi.postMessage({type:'getChatHistory'});
					currentView = 'HistoryView';
					break;
				}
				case 'showCurrentChat':{
					currentView = 'ChatView';
					await tick();
					inputTextArea?.focus();
					await scrollToBottom(outputArea,true);
					addCodeBlockButtons();
					resizeInputArea();
					break;
				}
				case 'selectionInfo':{
					hasSelection = data.hasSelection;
					selection = data.selection;
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
		setFetching(false);
		vscodeApi.postMessage({type:'setStatusBarActive'});
		
		switch(error_code){
			case '1': {
				chat = chat.concat({identity: Identity.errorMessage, 
									message: "Request Cancelled."})
				break;
			}
			default: {
				chat = chat.concat({identity: Identity.errorMessage, 
									message: "An Error Occured while fetching Responses."})
				break;
			}
		}
		// inputTextArea?.focus();
		await scrollToBottom(outputArea);
		addCodeBlockButtons();
		resizeInputArea();
	}

	async function handleCommandErrors(message:any) {
		// console.error(message)
		setFetching(false);
		vscodeApi.postMessage({type:'setStatusBarActive'});
		
		chat = chat.concat({identity: Identity.botMessage,message: message.message})
		// inputTextArea?.focus();
		await scrollToBottom(outputArea,true);
		addCodeBlockButtons();
		resizeInputArea();
	}

	async function generateResponse(){
		saveCurrentChat();

		shouldSaveCurrentChat = true; //only save chats once the user has given some
		setFetching(true);
		vscodeApi.postMessage({type:'setStatusBarFetching'});
		vscodeApi.postMessage({type:'startGeneration',chat:chat});

		// inputTextArea?.focus();
		await scrollToBottom(outputArea,true);
		addCodeBlockButtons();
		resizeInputArea();
	}

	function sendUserMessage() {
		//when the user is selecting a command using Enter Key
		if(showCommandPalette && commands.length>0){
			inputValue = commands[highlightIndex];
			inputTextArea.focus()
			return;
		}	

		// Remove Error message if present
		let temp = chat.pop()
		if(temp && temp.identity !== Identity.errorMessage)
			chat = chat.concat(temp)
		
		vscodeApi.postMessage({
			type: 'userInput',
			input: inputValue
		})
		inputValue="";
	}
	async function regenerateResponse() {
		chat.pop(); //remove the error message
		let temp = chat.pop();
		// if the error occured while generating.. remove the incomplete response
		if(temp && temp.identity !== Identity.botMessage)
			chat = chat.concat(temp)
		chat = chat;
		generateResponse();
	}

	function autoSave() {
		saveCurrentChat();
		setTimeout(autoSave, 5000) //Try to AutoSave Every 5 seconds.
	}

	function saveCurrentChat(){
		if(!shouldSaveCurrentChat)
			return;
		if(saveLock){
			// console.warn("Save State Locked... Trying to prevent Race Condition.")
			return;
		}
		saveLock = true;
		vscodeApi.postMessage({
			type:'saveCurrentChat',
			context: {
				chatId: currentChatId,
				chat: chat
			} as ChatContext
		});
	}


	function deleteChatById(message:any,chatIdToDelete:string) {
		console.log("Handling message", message.data, chatIdToDelete);
		if(chatIdToDelete!==currentChatId){
			vscodeApi.postMessage({type:'deleteChatHistory', chatIdDelete:chatIdToDelete});
		}
	}
	function deleteChatHistory(chatIdRetain:string) {
		vscodeApi.postMessage({type:'deleteChatHistory',chatIdRetain:chatIdRetain});
		confirmDialogDisplay = false;
	}

	function restoreChatById(chatIdToRestore:string) {
		if(chatIdToRestore!==currentChatId){
			vscodeApi.postMessage({type:'cancelRequest'});
			vscodeApi.postMessage({type:'restoreChatById', chatId:chatIdToRestore});
		}
		vscodeApi.postMessage({type:'showChatView'});
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

	async function scrollToBottom(node:any,force:boolean=false) {
		await tick();
		if(force)
			scrollLock = true;
		if(!node)
			return

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
	
	function resizeInputArea() {
		let element = document.getElementsByClassName('input-area')[0] as HTMLElement|undefined;
		if(element){
			element.style.height = 'auto';
			element.style.height = element.scrollHeight - 15 + 'px';  // 10 is a ad hoc constant to make the intial text area correct
		}
	}

	function setFetching(value:boolean){
		if(value){
			fetching = true;
			vscodeApi.postMessage({type:'disableArtemusCommands'});
		}
		else{
			fetching = false;
			vscodeApi.postMessage({type:'enableArtemusCommands'});
		}
	}

	function showConfirmDeleteDialog(){
		confirmDialogDisplay = !confirmDialogDisplay;
	}

	function cancelDelete(){
		confirmDialogDisplay = false;
	}

</script>





{#if loading}
	<div class="center">
		<div class="loader"></div>
	</div> 
{:else if currentView=='ChatView'}
	<div class="flex-container">
		<div bind:this={outputArea} class='output-area'>
		<MessageBox chat = {chatDisplay} on:click = {regenerateResponse} ></MessageBox>
		</div>
		<div class="chat-container">
			<div class="textarea-container">
			{#if fetching}
				<StopGenerateButton />
			{/if}
			<form>
				<CommandPalette show={showCommandPalette}
							commands={commands}
							commandHandler={commandHandler}
							highlightIndex={highlightIndex}></CommandPalette>
				<SelectionInfo {hasSelection} {selection}></SelectionInfo>
				<textarea bind:this={inputTextArea} class='input-area' placeholder="Ask something or '/' for commands" 
						  bind:value={inputValue} on:input={resizeInputArea} on:keypress={inputAreaKeypress} 
						  on:keydown={switchCommand}/>
				<button type='submit' class="send-button" {disabled} on:click|preventDefault={sendUserMessage}><Send /></button>
			</form>
			</div>
		</div>
	</div>
{:else if currentView=='HistoryView'}
	{#if chatHistory!==undefined}
		<ClearHistoryButton on:click={showConfirmDeleteDialog}/>
		<DeleteConfirmDialog display={confirmDialogDisplay}
							on:cancel={cancelDelete}
							on:delete={()=>{deleteChatHistory(currentChatId)}}></DeleteConfirmDialog>
		{#each chatHistory.chatItems.sort(sortChatDescending) as chatHistoryItem}
			<HistoryCard title={getLastUserMessage(chatHistoryItem.chatContext.chat).slice(0,100)} 
						date={new Date(chatHistoryItem.dateTime).toLocaleDateString()}
						time={new Date(chatHistoryItem.dateTime).toLocaleTimeString()}
						currentChat={currentChatId===chatHistoryItem.chatContext.chatId}
						on:message={(event)=>{deleteChatById(event,chatHistoryItem.chatContext.chatId)}}
						on:click={()=>{restoreChatById(chatHistoryItem.chatContext.chatId)}}>
			</HistoryCard>
		{/each}
	{:else}
	<div style='margin: 15px 10px;'>Nothing to show here. Start a new chat to talk to Artemus.</div>
	{/if}
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