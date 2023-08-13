<script>
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';
    import { merge_ssr_styles } from 'svelte/internal';

  function test(event){
    console.log("Clicked copy button")
    console.log(event)
  }
  const md = markdownit({
    html: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre><code>' +
                    hljs.highlight(lang, str, true).value +
                 `</code></pre><div class="code-heading">${hljs.getLanguage(lang).name}</div>`;
        } 
        catch (error) {
          console.error(error)
        }
      }
      return  '<pre><code>' +
                md.utils.escapeHtml(str) +
              `</code></pre><div class="code-heading">${""}</div>`;
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
  .para {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  :global(.code-heading) {
    position: absolute;
    top: 5px;
    left: 20px;
  }
  
</style>

<p class='para'>{@html md.render(markdownContent.spaceToNbsp()).MarkdownNbspToSpace().correctWhiteSpace()}</p>
<!-- {@html "<p>this is a test this is a test this is a test this is a test </p>"} -->