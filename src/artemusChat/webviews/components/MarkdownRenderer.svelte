<script>
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';

  const md = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<div>${hljs.getLanguage(lang).name}</div>`+
                 '<pre class="code-container"><code class="code-block">' +
                    hljs.highlight(lang, str, true).value +
                 '</code></pre>';
        } 
        catch (error) {
          console.error(error)
        }
      }
      return `<div></div>` +
              '<pre class="code-container"><code class="code-block">' +
                md.utils.escapeHtml(str) +
              '</code></pre>';
    }
  });

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
/*!
  css is placed in global file in media folder
*/
:global(.code-container){
    background-color: rgba(25, 24, 24, 0.792);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 20px;
    margin: 5px;
    overflow-y: scroll;
}
:global(.code-block){
  color: white;
  font-family: 'Courier New', Courier, monospace;
}
</style>

<div>{@html md.render(markdownContent)}</div>