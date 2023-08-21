<script lang="ts">
    export let title:string;
    export let date:string;
    export let time: string;
    export let currentChat = false;
</script>
  
<style>
   .history-card {
    background-color: rgba(0, 0, 0, 0.25);
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    margin: 10px 30px;
    box-shadow: 10px;
   }

   .history-card:active {
    background-color: rgba(255, 255, 255, 0.5);
    transform: scale(0.98);
   }
   
   .history-card:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.02);
    cursor: pointer;
   }
   
   .history-heading {
    font-size: 1.3em;
    font-weight: bold;
   }
</style>
  
<div class = "history-card" on:click|preventDefault  on:keydown|stopPropagation on:keyup|stopPropagation  on:keypress|stopPropagation>
{#if currentChat}
    <p>{date}   {time} (Current Chat)</p>
{:else}
    <p>{date}   {time}</p>
{/if}
    <p class="history-heading">{title}<p>
</div>
