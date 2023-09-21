<script lang="ts">
    import { cp } from "fs";
    import { each } from "svelte/internal";
    export let show:boolean = false;
    export let commands:string[] = ["item1","item2","item3","item4","item5"];
    export let highlightIndex:number = 0;
    export let commandHandler: (event: MouseEvent) => void;
    let commandPalette:HTMLDivElement;
    let cursorInDiv = false;
</script>
  
<style>
    .commandpalette {
        position: relative;
        margin: 5px 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgb(55,55,55);
        padding: 2px;
        overflow-y: auto;
        width: 100%;
        color: whitesmoke;
        font-family: 'Courier New', Courier, monospace;
    }

    .commandPalette-button {
        width: 100%;
        text-align: left;
        background-color: rgb(255,255,255,0.01);
        border: none;
        color: white;
        padding: 2px 10px;
        font-size: 1em;
    }
    .commandPalette-button:hover{
        background-color: rgba(255, 255, 255,0.2);
        cursor: pointer;
    }
    
    .highlight {
        background-color: rgba(255, 255, 255,0.2);
    }
</style>

{#if show && commands.length>0}
    <div on:mouseenter={(event)=>{cursorInDiv=true;}} on:mouseleave={(event)=>{cursorInDiv=false;}} class='commandpalette'>
    {#each commands as command,index}
        {#if index===highlightIndex && !cursorInDiv}
            <button class='commandPalette-button highlight' on:click|preventDefault={(event)=>{commandHandler(event)}}>{command}</button><br>
        {:else}
            <button class='commandPalette-button' on:click|preventDefault={(event)=>{commandHandler(event)}}>{command}</button><br>
        {/if}

    {/each}
    </div>
{/if}