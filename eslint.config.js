import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'src/data'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...vue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser,
      },
    },
    rules: {
      // Com noUncheckedIndexedAccess, `!` marca índices que o código já garante; proibir só geraria ruído.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // `.vue` usa o vue-eslint-parser, que repassa o <script> para o parser do TypeScript.
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser } },
  },
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },
  prettier,
);
