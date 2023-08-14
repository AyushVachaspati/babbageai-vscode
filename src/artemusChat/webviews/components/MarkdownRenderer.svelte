<script>
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';
    import { merge_ssr_styles } from 'svelte/internal';

  function test(event){
    console.log("Clicked copy button")
    console.log(event)
  }
  const md = markdownit({
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
      return  '<div class="code-block-container"><hr class="line"><pre class="code-block"><code>' +
                md.utils.escapeHtml(str) +
              `</code></pre><div class="code-heading">${""}</div></div>`;
    }
  });

  String.prototype.spaceToNbsp = function() {
    return this.replace(/ /g,"&nbsp;")
              .replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;");
  }
  String.prototype.MarkdownNbspToSpace = function() {
    return this.replace(/&amp;nbsp;/g," ")
  }
  String.prototype.correctWhiteSpace = function() {
    var regex = new RegExp(String.fromCharCode(160), "g");
    return this.replace(regex, " ");
  }

  export let markdownContent = `
# Hello Markdown!

\`\`\`python
def fibonacci(''):
    if n<2:
        return n
    else:
        return fibonacci(n-1)+fibonacci(n-2)
\`\`\`
  `;
</script>

<style>
  /* .para {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  } */

  :global(.code-block){
    color: var(--vscode-editor-foreground);
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
    position:relative;
  }
  :global(.code-heading) {
    position: absolute;
    top: 7px;
    left: 20px;
  }
  :global(.inner-code) {
    white-space: inherit;
    word-wrap: inherit;
  }
  :global(.line){
    color:white;
    background-color:white;
    position:absolute;
    top:25px;
    width:100%;
  }
  
</style>

{@html  md.render(markdownContent)}
<!-- {md.render(markdownContent.spaceToNbsp()).MarkdownNbspToSpace().correctWhiteSpace()} -->
<!-- <p class='para'>{@html md.render(markdownContent.spaceToNbsp()).MarkdownNbspToSpace().correctWhiteSpace()}</p> -->