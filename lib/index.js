import '@siminjs/web'

import { createRoot ,createImmediateEffect ,onCleanup ,untrack ,getScope } from '@siminjs/reaction'

import { env } from './env.js'
import { xml ,xmlNode } from './xml.js'
import { createDepth } from './create-depth.js'

export * as reaction from '@siminjs/reaction'

var idx

// var callToValue = (value, data) => (typeof value == 'function') ? value(data) : value

var getListOrVal = l => (l && (1 in l)) ? l : l?.[0]

function retrieveNodes (startPoint ,endPoint) {
  var nodes = [startPoint]

  while ((idx = nodes[nodes.length - 1]) !== endPoint) nodes.push(env.getNext(idx))

  return nodes
}

function buildNode (tag ,props ,children) {
  tag = env.isNode(tag) ? tag : env.createElement(tag)

  props = Array.isArray(props) ? props : Object.entries(props)

  for (idx = 0 ;idx < props.length ;idx++) (
    (typeof props[idx][1] == 'function')
      ? createImmediateEffect((attr = props[idx]) => (
        env.setAttribute(tag ,attr[0] ,attr[1]())
        
        ,attr
      ))
      : env.setAttribute(tag ,props[idx][0] ,props[idx][1])
  )

  children = resolveNodes(children)

  if (Array.isArray(children)) env.append(tag ,...children) ;else env.append(tag ,children)

  return tag
}

function buildComponent (fn ,props = {} ,children) {
  var nodes

  if (Array.isArray(props)) props = Object.fromEntries(props)

  createImmediateEffect(() => (nodes = resolveNodes(
    untrack(fn ,{ children ,...props })
  )))

  return nodes
}

function buildXML ({tagName ,attributes ,children}) {
  if (typeof tagName == 'function') return buildComponent(tagName ,attributes ,getListOrVal(children))
  else return buildNode(tagName ,attributes ,getListOrVal(children))
}

function buildFn (f) {
  var nodes

  createImmediateEffect(prevNodes => {
    nodes = resolveNodes(f())
    
    if (prevNodes) {
      prevNodes = retrieveNodes(prevNodes[0] ,prevNodes[prevNodes.length - 1])

      if (Array.isArray(nodes)) {
        if (nodes[0] != prevNodes[0]) nodes.unshift(prevNodes[0])
        if (nodes[nodes.length - 1] != prevNodes[prevNodes.length - 1]) nodes.push(prevNodes[prevNodes.length - 1])
      }
      else  nodes = [prevNodes[0] ,nodes ,prevNodes[prevNodes.length - 1]]

      for (idx = 1 ;idx < (prevNodes.length - 1) ;idx++) {
        if (idx == 1) env.replace(prevNodes[1] ,...nodes.slice(1, -1))
        else env.remove(prevNodes[idx])
      }
    }
    else if (getScope().obsSubs.length) {
      if (Array.isArray(nodes)) {
        if (!env.isMarker(nodes[0])) nodes.unshift(env.createMarker())
        if (!env.isMarker(nodes[nodes.length - 1])) nodes.push(env.createMarker())
      }
      else nodes = [env.createMarker() ,nodes ,env.createMarker()]
    }

    return nodes
  })

  return nodes
}

function resolveNodes (entry) {
  if (env.isNode(entry)) return entry
  else if (typeof entry == 'function') return buildFn(entry)
  else if (entry && Object.hasOwn(entry ,xmlNode)) return buildXML(entry)
  else if (Array.isArray(entry)) return entry.flatMap(resolveNodes)

  return env.createText(entry ?? '')
}

export var $ = {h: undefined ,html: undefined}

createDepth($ ,'h' ,(isDeep ,tag ,...args) => (
  (typeof tag == 'function')
    ? isDeep ? () => buildComponent(tag ,...args) : buildComponent(tag ,...args)
    : isDeep ? () => buildNode(tag ,...args) : buildNode(tag ,...args)
))
createDepth($ ,'html' ,(isDeep ,...args) => (
  isDeep ? () => resolveNodes(getListOrVal(xml(...args))) : resolveNodes(getListOrVal(xml(...args)))
))

export function render (fn ,dest = document.body) {
  return createRoot(dispose => {
    var nodes = resolveNodes(fn())

    if (!Array.isArray(nodes)) nodes = [nodes]

    env.append(dest ,...nodes)

    onCleanup(() => {
      nodes = retrieveNodes(nodes[0] ,nodes[nodes.length - 1])

      for (idx = 0 ;idx < nodes.length ;idx++) env.remove(nodes[idx])
    })

    return dispose
  })
}
