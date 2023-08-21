<script lang="ts">
  let buttonText = 'Clear Chat History';
</script>

<style>
  .clear-history-button {
    color: white;
    position: relative;
    background-color: rgba(40, 40, 40, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 15px;
    padding: 7px 15px;
    margin: 10px;
  }
  .clear-history-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  .clear-history-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  
  .clear-history-button:active {
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
</style>

<button type='submit' class="clear-history-button" on:click|preventDefault>{buttonText}</button>
