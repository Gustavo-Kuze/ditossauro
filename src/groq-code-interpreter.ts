import Groq from 'groq-sdk';

export class GroqCodeInterpreter {
  private client: Groq | null = null;
  private apiKey: string;
  private systemPrompt: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey || '';

    if (this.apiKey) {
      this.client = new Groq({
        apiKey: this.apiKey,
      });
    }

    this.systemPrompt = `## LLM Prompt – Speech-to-Code Interpreter

### Model Role

You are a **speech-to-code interpreter**.
Your job is to analyze an input text written in natural language and determine whether it contains **clear intent to produce source code** (conditions, variables, assignments, logic, structures, etc).

---

### Core Rules

1. **If there is any portion that can clearly be converted into code**, return **ONLY the converted code**, as a **single string**, with no explanations.
2. **If nothing in the text can be reasonably converted into code**, return **the exact same input string**, unchanged.
3. Do **not** add comments, explanations, markdown, or extra formatting.
4. Assume the generated code must follow **modern JavaScript**.
5. Prefer:

   * \`camelCase\` for variables
   * \`const\` whenever possible
   * Concise expressions
6. Interpret spoken language patterns such as:

   * "dot" → \`.\`
   * "open parenthesis / close parenthesis"
   * "open curly braces / close curly braces"
   * "equals", "assign", "receives"
   * "if / then / else"
   * "true / false"
7. Simple inferences are allowed (e.g. "if X is false" → \`!x\`)
8. Strings must use single quotes \`'\`.

---

### Examples

**Input**

\`\`\`
If user dot id exists then write user logged in
\`\`\`

**Output**

\`\`\`
if(user.id) {
    console.log('user logged in');
}
\`\`\`

---

**Input**

\`\`\`
Create a boolean variable show progress that receives true when is loading is false
\`\`\`

**Output**

\`\`\`
const showProgress = !isLoading;
\`\`\`

---

**Input**

\`\`\`
It is raining a lot today in São Paulo
\`\`\`

**Output**

\`\`\`
It is raining a lot today in São Paulo
\`\`\`

---

### Final Decision Rule

* If the text **expresses programming intent**, generate code.
* If the text is **purely conversational or descriptive**, do not transform it.`;
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey.length > 0;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
    }
  }

  async interpretCode(transcribedText: string): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    if (!transcribedText || transcribedText.trim() === '') {
      return '';
    }

    try {
      console.log(`🤖 Interpreting code with Groq: "${transcribedText}"`);

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: 'if test variable is true than write passed to the console'
          },
          {
            role: 'assistant',
            content: 'if(testVariable){ console.log(\'passed\') }'
          },
          {
            role: 'user',
            content: transcribedText
          }
        ],
        model: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: false,
        stop: null
      });

      const result = chatCompletion.choices[0]?.message?.content || transcribedText;
      console.log(`✅ Code interpretation result: "${result}"`);

      return result.trim();
    } catch (error: any) {
      console.error('❌ Groq code interpretation error:', error);

      // Handle specific Groq API errors
      if (error?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your credentials.');
      } else if (error?.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      } else if (error?.message) {
        throw new Error(`Groq API error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred during Groq code interpretation');
      }
    }
  }

  async interpretCodeStreaming(
    transcribedText: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    if (!transcribedText || transcribedText.trim() === '') {
      return '';
    }

    try {
      console.log(`🤖 Interpreting code with Groq (streaming): "${transcribedText}"`);

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: 'if test variable is true than write passed to the console'
          },
          {
            role: 'assistant',
            content: 'if(testVariable){ console.log(\'passed\') }'
          },
          {
            role: 'user',
            content: transcribedText
          }
        ],
        model: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: true,
        stop: null
      });

      let fullContent = '';
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      console.log(`✅ Code interpretation result: "${fullContent}"`);
      return fullContent.trim();
    } catch (error: any) {
      console.error('❌ Groq code interpretation error:', error);

      // Handle specific Groq API errors
      if (error?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your credentials.');
      } else if (error?.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      } else if (error?.message) {
        throw new Error(`Groq API error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred during Groq code interpretation');
      }
    }
  }
}
