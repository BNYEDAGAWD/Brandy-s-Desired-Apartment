import { beforeAll, afterEach } from 'vitest';

beforeAll(() => {
  global.localStorage = {
    storage: {},
    getItem: function(key) {
      return this.storage[key] || null;
    },
    setItem: function(key, value) {
      this.storage[key] = value;
    },
    removeItem: function(key) {
      delete this.storage[key];
    },
    clear: function() {
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