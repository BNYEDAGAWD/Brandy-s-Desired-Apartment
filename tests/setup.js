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

  // Mock DOM elements required by tests
  const mockElements = {
    'searchBtn': { style: { display: 'block' }, addEventListener: () => {} },
    'loadingIndicator': { style: { display: 'none' } },
    'resultsSection': { style: { display: 'none' }, scrollIntoView: () => {} },
    'filterPanel': { style: { display: 'none' } },
    'sortBy': { value: 'score', addEventListener: () => {} },
    'minScore': { value: '60', addEventListener: () => {} },
    'minScoreValue': { textContent: '60' },
    'recentOnly': { checked: false, addEventListener: () => {} },
    'renovatedOnly': { checked: false, addEventListener: () => {} },
    'premiumOnly': { checked: false, addEventListener: () => {} },
    'resultsCount': { textContent: '' },
    'resultsGrid': { innerHTML: '' },
    'recentResults': { innerHTML: '' },
    'recentListings': { style: { display: 'none' } },
    'noResults': { style: { display: 'none' } },
    'toastContainer': { 
      appendChild: (element) => {},
      removeChild: (element) => {},
      querySelector: () => null
    },
    'apartmentModal': { style: { display: 'none' }, classList: { add: () => {}, remove: () => {} } },
    'modalTitle': { textContent: '' },
    'modalBody': { innerHTML: '' },
    'bookmarkBtn': { innerHTML: '', onclick: null },
    'closeModal': { addEventListener: () => {} },
    'toggleFilters': { addEventListener: () => {} },
    'exportBtn': { addEventListener: () => {} },
    'step1': { className: 'step' },
    'step2': { className: 'step' },
    'step3': { className: 'step' },
    'step4': { className: 'step' }
  };

  global.document = {
    getElementById: (id) => {
      if (mockElements[id]) {
        return mockElements[id];
      }
      return { 
        style: { display: 'none' }, 
        innerHTML: '', 
        textContent: '', 
        addEventListener: () => {},
        className: 'step',
        classList: { add: () => {}, remove: () => {} },
        querySelector: () => null,
        querySelectorAll: () => [],
        parentElement: null,
        childNodes: []
      };
    },
    querySelector: (selector) => {
      if (selector === '.filter-content') {
        return { style: { display: 'block' } };
      }
      return { 
        style: { display: 'block' },
        querySelector: () => null,
        querySelectorAll: () => []
      };
    },
    querySelectorAll: () => [],
    createElement: (tag) => ({
      className: '',
      innerHTML: '',
      setAttribute: () => {},
      click: () => {},
      classList: { 
        add: () => {}, 
        remove: () => {},
        contains: () => false
      },
      style: { display: 'none' },
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    }),
    addEventListener: () => {},
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };

  global.window = {
    URL: {
      createObjectURL: () => 'mock-url',
      revokeObjectURL: () => {}
    }
  };
});

afterEach(() => {
  if (global.localStorage) {
    global.localStorage.clear();
  }
});