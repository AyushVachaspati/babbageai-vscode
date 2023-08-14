<script lang="ts">
  import { SvelteComponent } from "svelte";
  import Copy from "./icons/copy.svelte";
  let isCopied = false;
  let buttonText = 'Copy Code'
  let innerWidth = 0; 
  function copyCode(event:any){
    let parent = event.target.parentElement;
    let code = parent.querySelector('code').innerText;
    navigator.clipboard.writeText(code)
    buttonText = 'Copied \u2714'
    setTimeout(() => {buttonText = 'Copy Code'}, 1000)
}
</script>

<style>
  .copy-code-button {
    color: white;
    font-weight: 300;
    text-align:center;
    position: absolute;
    top: 5px;
    right: 15px;
    background-color: transparent;
		border: None;
		border-radius: 5px;
  }
  .copy-code-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  
  .copy-code-button-small {
    position: absolute;
    top: 5px;
    right: 15px;
    background-color: transparent;
    border: None;
    border-radius: 5px;
  }
  .copy-code-button-small:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
</style>

<svelte:window bind:innerWidth></svelte:window>

{#if innerWidth>400}
  <button type='submit' class="copy-code-button" title='Copy Code' on:click|preventDefault={copyCode}><Copy />  {buttonText}</button>
{:else}
  <button type='submit' class="copy-code-button-small" title='Copy Code' on:click|preventDefault={copyCode}><Copy /></button>
{/if}
