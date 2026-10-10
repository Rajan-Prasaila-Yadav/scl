const fs = require('fs'), babel = require('next/dist/compiled/babel/core')
const results=[]
for(const dir of ['pages','components'])for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js'))){
 const source=fs.readFileSync(dir+'/'+file,'utf8')
 const ast=babel.parseSync(source,{babelrc:false,configFile:false,parserOpts:{plugins:['jsx']}})
 babel.traverse(ast,{JSXElement(path){const n=path.node,op=n.openingElement,tag=op.name.name;const attrs=Object.fromEntries(op.attributes.filter(a=>a.name).map(a=>[a.name.name,a]))
 if(['input','select','textarea'].includes(tag) && !attrs['aria-label'] && !attrs.id && !attrs['aria-labelledby'] && attrs.type?.value?.value!=='hidden' && !path.findParent(p=>p.isJSXElement()&&p.node.openingElement.name.name==='label')) results.push({file:dir+'/'+file,line:n.loc.start.line,issue:'Unlabeled '+tag})
 }})
}
fs.writeFileSync('audit/remaining-control-labels.json',JSON.stringify(results,null,2))
console.log(`${results.length} fields need label review; see audit/remaining-control-labels.json`)
