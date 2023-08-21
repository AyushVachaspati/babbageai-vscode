<script lang="ts">
  import Send from "../icons/insertCode.svelte";
  export let disabled = false;
</script>

<style>
  .delete-history-item-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: transparent;
  border: None;
  border-radius: 5px;
  }
  .delete-history-item-button:hover:not([disabled]) {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }

  .delete-history-item-button:active {
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
  .delete-history-item-button:disabled{
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
</style>

<button type='submit' class="delete-history-item-button" title='Delete this Chat' on:click|preventDefault {disabled}><Send /></button>
