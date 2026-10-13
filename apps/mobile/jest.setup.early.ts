// Stub localStorage to prevent Node.js 22+ --localstorage-file warnings from MSW v2
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  },
  configurable: true,
  writable: true,
});
