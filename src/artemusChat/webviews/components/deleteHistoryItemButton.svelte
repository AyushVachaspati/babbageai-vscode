<script lang="ts">
  import Delete from '../icons/delete.svelte';
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let disabled = false;
  function forwardMessage(event:any) {
    dispatch('message', "delete");
  }
</script>

<style>
  .delete-history-item-button {
    position:absolute;
    right: 35px;
    background-color: transparent;
    border: None;
    border-radius: 5px;
  }
  .delete-history-item-button:hover{
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  .delete-history-item-button:active {
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
  .delete-history-item-button:disabled{
    background-color: rgba(255, 255, 255, 0.25);
  }
</style>

<div>
  <button type='submit' class="delete-history-item-button" title='Delete this Chat' on:click|preventDefault|stopPropagation={forwardMessage} {disabled}><Delete/></button>
</div>