<!-- src/Message.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

  export let display:Boolean;

  function onClickDelete(){
    dispatch("delete", "Delete")
  }

  function onClickCancel(){
    dispatch("cancel", "Cancel")
  }

</script>

<style>
  .confirm-dialog-box {
    background-color: rgb(50, 50, 50);
    padding: 10px;
    position: relative;
    margin: 0px 30px 10px 30px;
    color: white;
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.5;
    font-weight: 500;
    border-radius: 15px;
  }
  
  .button{
    border: none;
    padding: 10px 15px;
    text-align: center;
  }
  
  .button:hover {
    cursor: pointer;
    transform: scale(1.05);
  }
  
  .button:active {
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
  
  .confirm-delete-button{
    border-radius: 5px;
    background-color: red;
    color: white;
  }

  .cancel-button{
    border-radius: 5px;
    background-color: grey;
    color: black;
  }

</style>
{#if display}
  <div class="confirm-dialog-box">
    <p style="font-size: 16px;">Are you sure you want to <strong>Delete All Chat History?</strong></p>
    <br>
    <button class="button cancel-button" on:click={onClickCancel}>Cancel</button>
    <button class="button confirm-delete-button" on:click={onClickDelete}>Delete</button>
  </div>
{/if}