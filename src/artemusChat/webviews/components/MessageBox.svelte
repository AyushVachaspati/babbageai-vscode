<!-- src/Message.svelte -->
<script lang="ts">
    import { merge_ssr_styles } from "svelte/internal";
    import {type Message, Identity } from "../types/message";
    import MarkdownRenderer from "./MarkdownRenderer.svelte";

  export let chat:Message[] = [];
  export let blink = true;
</script>

<style>
  .message_bot {
    background-color: rgb(18, 18, 18);
    padding: 15px;
    position: relative;
    /* white-space: pre-wrap; */
    margin-bottom: 10px;
    font-size: 14.5px;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.5;
  }
    
  .message_human {
    background-color: rgb(18, 18, 18, 0.3);
    padding: 15px;
    position: relative;
    /* white-space: pre-wrap; */
    margin-bottom: 10px;
    font-size: 14.5px;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.5;
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

  .blink {
    animation: blink 1s steps(1, end) infinite;
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>

<div class = 'container'>
  {#each chat as msg}
    {#if msg.identity===Identity.User}
      <div class="message_human border-gradient-right border-gradient-purple">
        <MarkdownRenderer markdownContent={msg.message}/>
        {#if blink}
	        <span class="blink">|</span>
        {/if}
      </div>
    {:else if msg.identity===Identity.Bot}
      <div class="message_bot border-gradient-left border-gradient-purple">
        <MarkdownRenderer markdownContent={msg.message}/>
        {#if blink}
	        <span class="blink">|</span>
        {/if}
      </div>
    {/if}
  {/each}
</div>