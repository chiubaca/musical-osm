module.exports = {
  extends: ['airbnb', 'prettier'],
  parser: 'babel-eslint',
  plugins: ['prettier'],

  rules: {
    // No need to append .js extension to imports
    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
      },
    ],

    // Support JSX syntax in both .js and .jsx files
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],

    // Recommend not to leave any console.log in your code
    // Use console.error, console.warn and console.info instead
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'info'],
      },
    ],

    // ESLint plugin for prettier formatting
    // https://github.com/prettier/eslint-plugin-prettier
    'prettier/prettier': [
      'error',
      {
        // https://prettier.io/docs/en/options.html
        singleQuote: true,
        trailingComma: 'es5',
      },
    ],
  },
};