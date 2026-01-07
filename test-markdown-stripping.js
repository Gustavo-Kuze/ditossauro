/**
 * Test script for markdown code block stripping
 * Run with: node test-markdown-stripping.js
 */

function stripMarkdownCodeBlocks(text) {
  if (!text) return text;

  // Remove opening code block with language identifier (e.g., ```javascript)
  let cleaned = text.replace(/^```\w*\s*\n?/gm, '');

  // Remove closing code block (```)
  cleaned = cleaned.replace(/\n?```\s*$/gm, '');

  // Also handle inline code blocks (single backticks) if the entire response is wrapped
  if (cleaned.startsWith('`') && cleaned.endsWith('`') && !cleaned.includes('\n')) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned.trim();
}

// Test cases based on your examples
const tests = [
  {
    name: 'JavaScript code with markdown',
    input: '```javascript\nfor(let i = 1; i <= 100; i++) {\n\n}\n```',
    expected: 'for(let i = 1; i <= 100; i++) {\n\n}'
  },
  {
    name: 'JavaScript code with markdown (no newline at end)',
    input: '```javascript\nfor (let i = 0; i < 100; i++) {\n  console.log(i);\n}```',
    expected: 'for (let i = 0; i < 100; i++) {\n  console.log(i);\n}'
  },
  {
    name: 'Inline code with backticks',
    input: '```\nconsole.log\n```',
    expected: 'console.log'
  },
  {
    name: 'Single line with backticks',
    input: '`console.log`',
    expected: 'console.log'
  },
  {
    name: 'Bash command (no markdown)',
    input: 'find . -type d -name node_modules',
    expected: 'find . -type d -name node_modules'
  },
  {
    name: 'Python code with markdown',
    input: '```python\nfor _ in range(100):\n    print(\'hello world\')\n```',
    expected: 'for _ in range(100):\n    print(\'hello world\')'
  },
  {
    name: 'TypeScript code with markdown',
    input: '```typescript\ninterface User {\n  name: string;\n  email: string;\n}\n```',
    expected: 'interface User {\n  name: string;\n  email: string;\n}'
  },
  {
    name: 'No markdown (plain code)',
    input: 'const x = 10;',
    expected: 'const x = 10;'
  },
  {
    name: 'Empty string',
    input: '',
    expected: ''
  },
  {
    name: 'Markdown without language',
    input: '```\nconst hello = "world";\n```',
    expected: 'const hello = "world";'
  }
];

// Run tests
console.log('🧪 Testing Markdown Code Block Stripping\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = stripMarkdownCodeBlocks(test.input);
  const success = result === test.expected;

  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    console.log(`   Input length: ${test.input.length}, Output length: ${result.length}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Input:\n${test.input}`);
    console.log(`   Expected:\n${test.expected}`);
    console.log(`   Got:\n${result}`);
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
}
