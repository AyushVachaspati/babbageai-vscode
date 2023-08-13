<script lang="ts">
  import Send from "./icons/copy.svelte";
  let isInserted = false;
  let buttonText = 'Insert Code'
  let innerWidth = 0; 
  function insertCode(event:any){
    let parent = event.target.parentElement;
    let code = parent.querySelector('code').innerText;
    vscodeApi.postMessage({type:'insertCode',code:code});
    buttonText = 'Inserted \u2714'
    setTimeout(() => {buttonText = 'Insert Code'}, 1000)
  }
</script>

<style>
  .insert-code-button {
    color: white;
    font-weight: 300;
    text-align:center;
    position: absolute;
    top: 5px;
    right: 110px;
    background-color: transparent;
		border: None;
		border-radius: 5px;

  }
  .insert-code-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }

  .insert-code-button-small {
  position: absolute;
  top: 5px;
  right: 40px;
  background-color: transparent;
  border: None;
  border-radius: 5px;
  }
  .insert-code-button-small:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }

</style>

<svelte:window bind:innerWidth></svelte:window>


{#if innerWidth>350}
  <button type='submit' class="insert-code-button" title='Insert At Cursor' on:click|preventDefault={insertCode}><Send />  {buttonText}</button>
{:else}
  <button type='submit' class="insert-code-button-small" title='Insert At Cursor' on:click|preventDefault={insertCode}><Send /></button>
{/if}