import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import htmlPlugin from 'eslint-plugin-html';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Image: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      html: htmlPlugin
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': 'error',
      'arrow-spacing': 'error',
      'comma-dangle': ['error', 'never'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    files: ['**/*.html'],
    plugins: {
      html: htmlPlugin
    }
  },
  {
    files: ['tests/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        // Test globals (Vitest)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Image: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly'
      }
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.min.js',
      '*.html',
      'vite.config.js',
      'lighthouserc.js'
    ]
  },
  prettierConfig
];