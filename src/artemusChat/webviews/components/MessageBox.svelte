<!-- src/Message.svelte -->
<script lang="ts">
  import { merge_ssr_styles } from "svelte/internal";
  import {type Message, Identity } from "../types/message";
  import MarkdownRenderer from "./MarkdownRenderer.svelte";
  import RegenerateButton from "./regenerateButton.svelte";
  export let chat:Message[] = [];
</script>

<style>
  .message_bot {
    background-color: rgb(18, 18, 18);
    padding: 15px;
    position: relative;
    margin-bottom: 10px;
    font-size: 14.5px;
    color: white;
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.5;
    font-weight: 500;
    /* border-radius: 15px; */
  }
    
  .message_human {
    background-color: rgb(40, 40, 40);
    padding: 15px;
    position: relative;
    margin-bottom: 10px;
    font-size: 14.5px;
    color: white;
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.5;
    font-weight: 500;
    /* border-radius: 15px; */
  }

  .message_error {
    background-color: rgba(255, 0, 0, 0.125);
    padding: 15px;
    position: relative;
    margin-bottom: 10px;
    font-size: 14.5px;
    color: white;
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.5;
    font-weight: 500;
    /* border-radius: 15px; */
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
    font-size: 17px;
    font-weight: 900;
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
    {#if msg.identity===Identity.userMessage}
      <div class="message_human border-gradient-right  border-gradient-purple">
        <MarkdownRenderer markdownContent={msg.message}/>
      </div>
    {:else if msg.identity===Identity.botMessage}
      <div class="message_bot border-gradient-left border-gradient-purple">
        <MarkdownRenderer markdownContent={msg.message}/>
        {#if msg.message===""}
	        <span class="blink">|</span>
        {/if}
      </div>
    {:else if msg.identity===Identity.errorMessage}
      <div class="message_error">
        <RegenerateButton on:click></RegenerateButton>
        <MarkdownRenderer markdownContent={msg.message}/>
      </div>
    {/if}
  {/each}
</div>