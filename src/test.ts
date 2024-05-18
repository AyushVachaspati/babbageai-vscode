import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  baseURL: 'https://starchat.inference.llm.simplismart.ai',
  dangerouslyAllowBrowser: true
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: 'starchat',
    messages: [{"role":"system", "content": "you are a python developer"},
              {"role":"user", "content": "write a topological sort"}],
    stream: true,
    temperature: 1,
    max_tokens: 256,
    top_p: 1
  });
  console.log("session created")
  for await (const chunk of stream) {
    console.log(chunk.choices[0]?.delta?.content || '');
  }
}

main();