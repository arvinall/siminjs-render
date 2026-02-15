import '@siminjs/web'

import { createRoot ,createImmediateEffect ,onCleanup ,untrack ,getScope } from '@siminjs/reaction'

import { env } from './env.js'
import { xml ,xmlNode } from './xml.js'
import { createDepth } from './create-depth.js'
import { applyProp } from './prop-appliers.js'

export * as reaction from '@siminjs/reaction'

var idx ,length

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

  for (idx = 0 ,length = props.length ;idx < length ;idx++) applyProp(tag ,props[idx][0] ,props[idx][1])

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
  var
    node = (typeof tagName == 'function')
      ? buildComponent(tagName ,attributes ,getListOrVal(children))
      : buildNode(tagName ,attributes ,getListOrVal(children))
    
    ,directive

  for (idx = 0 ,length = attributes.length ;idx < length ;idx++) {
    if (typeof (directive = attributes[idx][0]) == 'function') directive(node ,attributes[idx][1])
    else if (typeof (directive = attributes[idx][0]?.[0]) == 'function') directive(node ,attributes[idx][1] ,attributes[idx][0][1])
  }

  return node
}

function buildFn (f) {
  var nodes

  createImmediateEffect(prevNodes => {
    var endPoint

    nodes = resolveNodes(f())
    
    if (prevNodes) {
      endPoint = prevNodes[prevNodes.length - 1]

      prevNodes = retrieveNodes(prevNodes[0] ,endPoint)

      if (Array.isArray(nodes)) {
        if (nodes[0] != prevNodes[0]) nodes.unshift(prevNodes[0])
        if (nodes[nodes.length - 1] != endPoint) nodes.push(endPoint)
      }
      else  nodes = [prevNodes[0] ,nodes ,endPoint]

      if (prevNodes.length == 2) (nodes.push(endPoint) ,prevNodes.push(endPoint))

      for (idx = 1 ,length = (prevNodes.length - 1) ;idx < length ;idx++) {
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

      for (idx = 0 ,length = nodes.length ;idx < length ;idx++) env.remove(nodes[idx])
    })

    return dispose
  })
}
