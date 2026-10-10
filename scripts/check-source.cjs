const fs = require('fs')
const babel = require('next/dist/compiled/babel/core')
const globals = new Set(('DOMParser indexedDB window document localStorage sessionStorage location navigator console alert confirm prompt FileReader File Blob URL URLSearchParams FormData Event CustomEvent Image Intl Math Date Number String Object Array Map Set WeakMap WeakSet JSON RegExp Promise Error TypeError Boolean Symbol BigInt undefined NaN Infinity parseInt parseFloat isNaN isFinite setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame crypto process require module Buffer btoa atob encodeURIComponent decodeURIComponent globalThis performance').split(' '))
let failed = false
for (const dir of ['pages','components','lib']) for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.js'))) {
  const file = dir + '/' + name
  try {
    const ast = babel.parseSync(fs.readFileSync(file,'utf8'), {babelrc:false,configFile:false,parserOpts:{plugins:['jsx']}})
    babel.traverse(ast, { ReferencedIdentifier(path) {
      const name = path.node.name
      if (path.node.type === 'JSXIdentifier' && /^[a-z]/.test(name)) return
      if (!path.scope.hasBinding(name) && !globals.has(name)) { console.error(`${file}:${path.node.loc.start.line}: undefined ${name}`); failed = true }
    } })
  } catch(e) { console.error(file + ': ' + e.message); failed = true }
}
if (failed) process.exitCode = 1
else console.log('All application sources parse; no unresolved identifiers.')
