const { vi } = require('vitest');

// Create a mock
const mockFn = vi.fn(() => 'first');

console.log('Call 1:', mockFn()); // Should be 'first'

mockFn.mockReturnValue('second');

console.log('Call 2:', mockFn()); // Should be 'second'

mockFn.mockClear();

console.log('Call 3:', mockFn()); // Should still be 'second' (mockClear doesn't reset implementation)
console.log('Calls:', mockFn.mock.calls.length); // Should be 1 (only call 3)

