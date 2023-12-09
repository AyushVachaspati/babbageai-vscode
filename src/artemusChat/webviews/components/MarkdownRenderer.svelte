<script>
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';
    import { merge_ssr_styles } from 'svelte/internal';

  function test(event){
    console.log("Clicked copy button")
    console.log(event)
  }
  const md = markdownit({
    linkify: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<div class="code-block-container"><hr class="line"><pre class="code-block"><code class="inner-code">' +
                    hljs.highlight(lang, str, true).value +
                 `</code></pre><div class="code-heading">${hljs.getLanguage(lang).name}</div></div>`;
        } 
        catch (error) {
          console.error(error)
        }
      }
      return  '<div class="code-block-container"><hr class="line"><pre class="code-block"><code class="inner-code">' +
                md.utils.escapeHtml(str) +
              `</code></pre><div class="code-heading">${""}</div></div>`;
    }
  });

  String.prototype.spaceToNbsp = function() {
    
    //Not replacing single space (" ") because that is significant in Markdown.
    //only Tab and Tab equivalent, i.e 2,4,6,8 spaces are being replaced.
    return this.replace(/  /g,"&nbsp;&nbsp;")
              .replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;");
  }

  String.prototype.MarkdownNbspToSpace = function() {
    var regex = new RegExp(`<span class="hljs-operator">&amp;</span>nbsp;`, "g"); // Dirty fix for highlighed "&" in sql
    return this.replace(/&amp;nbsp;/g," ").replace(regex," ")
  }

  String.prototype.correctWhiteSpace = function() {
    var regex = new RegExp(String.fromCharCode(160), "g");
    return this.replace(regex, " ");
  }
  
  String.prototype.fixCodeBlockFontWeight = function() {
    return this.replace(/<pre><code class="/g, '<pre><code class="outer-code ')
               .replace(/<pre><code>/g, '<pre><code class="outer-code" >');
  }

  export let markdownContent = "";
</script>

<style>
  /* .para {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  } */

  :global(.code-block){
    color: inherit;
    font-family: 'Courier New', Courier, monospace;
    background-color: rgba(24, 24, 24, 0.792);
    /* background-color: rgba(118, 32, 32, 0.712); */
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    padding: 3rem 1rem 1rem 1rem;
    overflow: auto;
    position:relative;
  }
  :global(.code-block-container){
    color:white;
    position:relative;
  }
  :global(.code-heading) {
    position: absolute;
    top: 7px;
    left: 20px;
  }
  :global(.inner-code) {
    color: inherit;
    white-space: inherit;
    word-wrap: inherit;
    font-weight: inherit;
  }
  :global(.outer-code){
    font-weight: inherit;
    padding: 0;
  }

  :global(.line){
    color:white;
    background-color:white;
    position:absolute;
    top:25px;
    width:100%;
  }
  
</style>

{@html md.render(markdownContent.spaceToNbsp()).MarkdownNbspToSpace().correctWhiteSpace().fixCodeBlockFontWeight()}
<!-- {md.render(markdownContent.spaceToNbsp()).MarkdownNbspToSpace().correctWhiteSpace()} -->
<!-- <p class='para'>{@html md.render(markdownContent.spaceToNbsp()).MarkdownNbspToSpace().correctWhiteSpace()}</p> -->