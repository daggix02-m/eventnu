import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Guards against a Tailwind v4 landmine: this project defines spacing tokens
// (sm/md/lg/xl/2xl/3xl) in app/globals.css, and Tailwind resolves the max-width
// scale from the spacing namespace first, so named max-width classes collapse to
// tiny pixel widths instead of container widths. Use explicit rem widths instead.
const spacingShadowGuard = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban named max-width scale classes that resolve to spacing tokens',
    },
    messages: {
      spacingShadow:
        "Avoid '{{names}}' — these named max-width classes resolve to spacing tokens in this project. Use an explicit rem width instead.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== 'className') return
        const lit = node.value
        if (!lit) return
        const value =
          lit.type === 'Literal' || lit.type === 'StringLiteral' ? String(lit.value ?? '') : null
        if (value === null) return
        const matches = value.match(/\bmax-w-(xs|sm|md|lg|xl|2xl|3xl)\b/g)
        if (matches?.length) {
          context.report({
            node,
            messageId: 'spacingShadow',
            data: { names: matches.join(' ') },
          })
        }
      },
    }
  },
}

const eslintConfig = [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'next-env.d.ts',
      'coverage/',
      'stitch-screenshots/',
      'packages/convex/**',
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@next/next/no-img-element': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'spacing-shadow': { rules: { guard: spacingShadowGuard } },
    },
    rules: {
      'spacing-shadow/guard': 'error',
    },
  },
  {
    files: ['**/*.config.{ts,js,mjs,cts,mts}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]

export default eslintConfig
