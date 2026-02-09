import { parse as parseTxml } from 'txml'

const push = (list ,stack ,cmd) => list?.length && stack.push([cmd ,list])

const slicers = ['shift' ,'pop']

const iterate = (fns ,lists ,isDeep) => fns && lists && ((
  cmds = Object.keys(fns)

  ,slicer = slicers[+!!isDeep]
  
  ,stack = []
  
  ,_push = (list ,cmd) => push(list ,stack ,cmd)
  
  ,cmd ,list
) => {
  Object.values(cmds).forEach((cmd ,idx) => (cmds[cmd] = idx))

  lists.forEach((list ,idx) => _push(list ,cmds[idx]))

  while (stack[0]) {
    [cmd ,list] = stack[slicer]()

    list.forEach((v ,idx ,list) => fns[cmd](v ,cmds ,_push ,idx ,list))
  }
})()

const varPlaceholderPrefix = 'v' + String.fromCodePoint(16)
const varPlaceholderAppendix = String.fromCodePoint(18) + String.fromCodePoint(15)

const createVarPlaceholder = i => varPlaceholderPrefix + i + varPlaceholderAppendix

const varPlaceholderRegExp = new RegExp(createVarPlaceholder('(\\d+)') ,'g')

const getListOrVal = l => (l && (1 in l)) ? l : l?.[0]

let tmpVars

function replaceVarPlaceholders (str) {
  if (str?.split) {
    str = str.split(varPlaceholderRegExp)

    for (
      let idx = str.length - 1

      ;idx + 1

      ;idx--
    ) (
      str[idx]
        ? (idx % 2) && (str[idx] = tmpVars[str[idx]])
        : str.splice(idx, 1)
    )
  }

  return getListOrVal(str)
}

export const xmlNode = Symbol('XML Node')

const tXmlNormalizer = {
  normalize (item ,cmds ,push ,idx ,list) {
    if (typeof item == 'string') list[idx] = replaceVarPlaceholders(item)
    else {
      const attributes = [] 

      item.tagName = replaceVarPlaceholders(item.tagName)

      for (let attr in item.attributes) attributes.push([
        replaceVarPlaceholders(attr)
        
        ,replaceVarPlaceholders(item.attributes[attr])
      ])

      item.attributes = attributes

      item[xmlNode] = true

      push(item.children ,cmds[cmds.normalize])
    }
  }
}

const tmpUniqueVars = new Map()

export const xml = ({raw: statics} ,...vars) => {
  let xml = '' ,tXml

  for (
    let idx = 0 ,lastIdx = statics.length - 1

    ;idx <= lastIdx

    ;idx++
  ) (
    (xml += statics[idx])

    ,(idx != lastIdx) && (
      !tmpUniqueVars.has(vars[idx]) && tmpUniqueVars.set(vars[idx] ,idx)

      ,(xml += createVarPlaceholder(tmpUniqueVars.get(vars[idx])))
    )
  )

  tmpUniqueVars.clear()

  tXml = parseTxml(xml)

  tmpVars = vars

  iterate(tXmlNormalizer ,[tXml] ,true)

  tmpVars = undefined

  return tXml
}
