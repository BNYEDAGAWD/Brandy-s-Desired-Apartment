import { beforeAll, afterEach } from 'vitest';

beforeAll(() => {
  global.localStorage = {
    storage: {},
    getItem(key) {
      return this.storage[key] || null;
    },
    setItem(key, value) {
      this.storage[key] = value;
    },
    removeItem(key) {
      delete this.storage[key];
    },
    clear() {
      this.storage = {};
    }
  };

  global.fetch = global.fetch || (() => Promise.resolve({
    json: () => Promise.resolve({})
  }));
});

afterEach(() => {
  if (global.localStorage) {
    global.localStorage.clear();
  }
});