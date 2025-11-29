module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    placeholderColor: false
  },
  theme: {
    extend: {}
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', 'html:not(.dark) &')
    },
    require('@tailwindcss/container-queries'),
    require('tailwindcss-multi'),
    require('tailwindcss/plugin')(function ({ addVariant }) {
      addVariant('em', ({ container }) => {
        container.walkRules(rule => {
          rule.selector = `.em\\:${rule.selector.slice(1)}`
          rule.walkDecls(decl => {
            decl.value = decl.value.replace('rem', 'em')
          })
        })
      })
    })
  ]
}
