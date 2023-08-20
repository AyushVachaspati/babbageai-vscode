<script lang="ts">
  let buttonText = 'Regenerate Response';
</script>

<style>
  .regenerate-button {
    color: white;
    position: absolute;
    bottom: -55px;
    left: 50%;
    margin-right: -50%;
    background-color: rgba(40, 40, 40, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 15px;
    transform: translate(-50%, -50%);
    padding: 7px 15px;
  }
  .regenerate-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  .regenerate-button:hover {
    background-color: rgba(255, 255, 255,0.05);
    cursor: pointer;
  }
  
  .regenerate-button:active {
    background-color: rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
</style>

<button type='submit' class="regenerate-button" on:click>{buttonText}</button>
