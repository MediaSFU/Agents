module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'prefer-const': 'off',
    'react/react-in-jsx-scope': 'off', // Disable need for React to be in scope
    'react/prop-types': 'off', // Disable prop-types validation (using TypeScript)
    'react-native/no-inline-styles': 'off', // Disable inline styles
    'no-shadow': 'off', // Disable shadowing variables
    'react-hooks/exhaustive-deps': 'off', // Disable exhaustive-deps rule
    '@typescript-eslint/no-shadow': 'off',
  },
};
