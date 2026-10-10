// Printable previews contain user-entered record text. Never execute embedded markup.
export function writePrintDocument(target, html) {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  parsed.querySelectorAll('script,iframe,object,embed,base,form,meta[http-equiv],link').forEach(el => el.remove())
  parsed.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name) || ['srcdoc','action','formaction'].includes(attr.name)) el.removeAttribute(attr.name)
      if (['href','src','xlink:href'].includes(attr.name) && !/^(data:image\/(png|jpeg|gif|webp);|blob:|#)/i.test(attr.value)) el.removeAttribute(attr.name)
    }
  })
  const policy = parsed.createElement('meta')
  policy.httpEquiv = 'Content-Security-Policy'
  policy.content = "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; form-action 'none'; base-uri 'none'"
  parsed.head.prepend(policy)
  target.opener = null
  target.document.write('<!doctype html>' + parsed.documentElement.outerHTML)
  target.document.querySelectorAll('button').forEach(button => button.addEventListener('click', () => target.print()))
}
