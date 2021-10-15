import { RuleTester } from 'eslint';

export const defaultRuleTester = () => {
  return new RuleTester({
    parser: `${__dirname}/../../node_modules/@typescript-eslint/parser/dist/index.js`,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  });
};

export const withOptions = (extraOptions) => (object) => ({
  ...object,
  options: [{ ...(object.options ? object.options[0] : {}), ...extraOptions }],
});

export const withErrors = (errors) => (object) => ({
  errors,
  ...object,
});
