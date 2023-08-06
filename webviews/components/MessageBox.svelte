<!-- src/Message.svelte -->
<script lang="ts">
    import { merge_ssr_styles } from "svelte/internal";
    import {type Message, Identity } from "../types/message";

  export let chat:Message[] = [];
</script>

<style>
  .message_bot {
    background-color: rgb(58, 58, 58);
    padding: 25px;
    position: relative;
    white-space: pre-line;
    margin-bottom: 10px;
  }
    
  .message_human {
    background-color: transparent;
    padding: 25px;
    position: abosolute;
    white-space: pre-line;
    margin-bottom: 10px;
  }

  .border-gradient-left {
    border-left: 2px solid;
    border-image-slice: 1;
  }
  .border-gradient-right {
    border-right: 2px solid;
    border-image-slice: 1;
  }
    .border-gradient-purple {
    border-image-source: linear-gradient(to bottom, #743ad5, #d53a9d);
  }
  
  .container{
    max-width: 100%;
    margin: 10px 10px 10px 0;
  }
</style>

<div class = 'container'>
  {#each chat as msg}
    {#if msg.identity===Identity.User}
      <div class="message_human border-gradient-right border-gradient-purple">
        {msg.message}
      </div>
    {:else if msg.identity===Identity.Bot}
      <div class="message_bot border-gradient-left border-gradient-purple">
        {msg.message}
      </div>
    {/if}
  {/each}
</div>