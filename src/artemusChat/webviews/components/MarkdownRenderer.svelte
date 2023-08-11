<script>
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';

  const md = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          console.log(lang)  //this gives the language here.. you can use this to add component at the top to show which lang. 
          return '<pre class="code-container"><code>' +
                 hljs.highlight(lang, str, true).value +
                 '</code></pre>';
        } catch (__) {}
      }
      
      return '<pre class="code-container"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
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
    background-color: rgb(25, 24, 24);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 20px;
    margin: 5px;
    overflow-y: scroll;
}
</style>

{@html md.render(markdownContent)}