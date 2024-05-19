<script lang="ts">
    import { cp } from "fs";
    import { each } from "svelte/internal";
    export let hasSelection:boolean = false;
    export let selection:String = "";
    let commandPalette:HTMLDivElement;
    let cursorInDiv = false;
</script>
  
<style>
    .codeSelection {
        position: relative;
        margin: 5px 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgb(55,55,55);
        padding: 5px;
        overflow-y: auto;
        width: 100%;
        color: whitesmoke;
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
    }
</style>

{#if hasSelection}
    <div class='codeSelection'>
        {selection}
    </div>
{/if}