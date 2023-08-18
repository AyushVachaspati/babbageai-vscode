<script lang="ts">
  let buttonText = 'Stop Generating'
  function stopGeneration(event:any){
    vscodeApi.postMessage({type:'cancelRequest'});
}
</script>

<style>
  .stop-generate-button {
    color: white;
    position: relative;
    top: 50%;
    left: 50%;
    margin-right: -50%;
    background-color: rgba(40, 40, 40, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 15px;
    transform: translate(-50%, -50%);
    padding: 7px 15px;
  }
  .stop-generate-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  .stop-generate-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  
  .stop-generate-button:active {
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
</style>

<button type='submit' class="stop-generate-button" on:click|preventDefault={stopGeneration}>{buttonText}</button>
