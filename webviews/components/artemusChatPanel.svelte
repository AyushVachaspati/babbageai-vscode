<script lang="ts">
	let inputValue = '';
	let disabled = true;
	let inputHeight = "3em";
	let imgSource = "";
	// function keyup(event){
	// 	if(disabled) 
	// 		return
	// 	if(event.keyCode===13 & !event.shiftKey){
	// 		sendMessage();
	// 	}
	// }
	
  function handleInput(event:any) {
    inputValue = event.target.value
		disabled = true;
		if(inputValue.trim())
			disabled = false;
	}

  function sendMessage() {
    // Add your logic to handle sending the message
    // For example, you can use the 'inputValue' variable to get the user's input.
    console.log("Sending message:", inputValue);
		inputValue="";
		disabled=true;
		document.getElementById("InputTextArea")?.focus()
  }
</script>

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
		margin: 10px;
		position: relative;
	}

	.send-button {
	background-color: darkcyan;
	border: None;
	position: absolute;
	bottom: 15px;
	right: 10px;
	padding: 5px;
	border-radius: 5px;	
	}
	.send-button:focus {
		outline: none;
		border: 1px solid white;
	}

	.send-button:hover:not([disabled])  {
		cursor: pointer;
	}

	button:disabled{
		background-color: gray;
	}
	.output-area{
		height: 100%;
		overflow-y: scroll;
		margin: 10px;
	}
	.input-area{
		padding-top: 14px;
		padding-top: 14px;
		padding-left: 10px;
		padding-left: 10px;
		/* padding: 12px; */
		resize: none;
		overflow-y: scrollbar;
		height: 3em;
		min-height: 3em;
		max-height: 15em;
		width: 100%;
		background: rgb(59, 58, 58);
		color: whitesmoke;
		font-family: 'Courier New', Courier, monospace;
		font-size: medium;
		border: none;
		border-radius: 10px;
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
</style>


<div class="flex-container">
	<div class='output-area'>
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>sdfsdf</p>	
	<p>{@html "testing markdown ```py<br> def print():\n```"}</p>
	</div>
	
	<div class="chat-container">
	  <div class="textarea-container">
	    <textarea id='InputTextArea' class='input-area' placeholder="Ask Artemus" bind:value={inputValue} on:input={handleInput} />
	    <button class="send-button" {disabled} on:click={sendMessage}>Send
		</button>
	  </div>
	</div>
	<!-- <div><p>Current Open File Goes Here </p></div> -->
	<!-- <br> -->
	<img src="" alt='Not Found'>
</div>

