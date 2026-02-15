import { createImmediateEffect ,onCleanup } from '@siminjs/reaction'

import { env } from './env.js'

var
  idx ,length

  ,attributeApplier = [// Default
    k => (typeof k != 'function') && !Array.isArray(k)

    ,(n ,k ,v) => (
      (typeof v == 'function')
        ? createImmediateEffect(() => env.setAttribute(n ,k ,v()))
        : env.setAttribute(n ,k ,v)

      ,onCleanup(() => env.removeAttribute(n ,k))
    )
  ]

  ,isLowerCase = char => (char == char.toLowerCase())

  ,inlineEventApplier = [
    k => k?.endsWith?.('.') && k.startsWith('on') && isLowerCase(k[2])

    ,(n ,k ,v) => (
      (k = k.slice(0 ,-1))

      ,env.assignProp(n ,k ,v)

      ,onCleanup(() => env.removeProp(n ,k))
    )
  ]

  ,eventApplier = [
    k => k?.startsWith?.('on')

    ,(n ,k ,v) => (
      (k = k.slice(2).toLowerCase())

      ,env.addListener(n ,k ,v?.[0] ?? v ,v?.[1])

      ,onCleanup(() => env.removeListener(n ,k ,v?.[0] ?? v ,v?.[1]))
    )
  ]

  ,propertyApplier = [
    k => k?.endsWith?.('.')

    ,(n ,k ,v) => (
      (k = k.slice(0 ,-1))

      ,(typeof v == 'function')
        ? createImmediateEffect(() => env.assignProp(n ,k ,v()))
        : env.assignProp(n ,k ,v)

      ,onCleanup(() => env.removeProp(n ,k))
    )
  ]

  ,booleanApplier = [
    k => k?.endsWith?.('?')

    ,(n ,k ,v) => (
      (k = k.slice(0 ,-1))

      ,(typeof v == 'function')
        ? createImmediateEffect(() => env[(v() ? 'setAttribute' : 'removeAttribute')](n ,k ,''))
        : env[(v ? 'setAttribute' : 'removeAttribute')](n ,k ,'')

      ,onCleanup(() => env.removeAttribute(n ,k))
    )
  ]

  ,applyClass = (n ,v) => {
    if (typeof v != 'object') return (
      env.setAttribute(n ,'class' ,v)

      ,() => env.removeAttribute(n ,'class')
    )
    else {
      v = Object.entries(v)

      for (idx = 0 ,length = v.length ;idx < length ;idx++) (
        (typeof v[idx][1] == 'function')
          ? createImmediateEffect((entry = v[idx]) => (
            entry[1]() ? env.addClass(n ,entry[0]) : env.removeClass(n ,entry[0])

            ,entry
          ))
          : v[idx][1] && env.addClass(n ,v[idx][0])
      )

      onCleanup(() => {
        for (idx = 0 ,length = v.length ;idx < length ;idx++) env.removeClass(n ,v[idx][0])
      })
    }
  }

  ,classApplier = [
    k => (k == 'class')

    ,(n ,k ,v) => {
      var cleanup

      if (typeof v == 'function') createImmediateEffect(() => (cleanup = applyClass(n ,v())))
      else (cleanup = applyClass(n ,v))

      if (cleanup) onCleanup(cleanup)
    }
  ]

  ,applyStyle = (n ,v) => {
    if (typeof v != 'object') return (
      env.setAttribute(n ,'style' ,v)

      ,() => env.removeAttribute(n ,'style')
    )
    else {
      v = Object.entries(v)

      for (idx = 0 ,length = v.length ;idx < length ;idx++) (
        (typeof v[idx][1] == 'function')
          ? createImmediateEffect((entry = v[idx]) => (
            env.setStyle(n ,entry[0] ,entry[1]())

            ,entry
          ))
          : env.setStyle(n ,v[idx][0] ,v[idx][1])
      )

      onCleanup(() => {
        for (idx = 0 ,length = v.length ;idx < length ;idx++) env.removeStyle(n ,v[idx][0])
      })
    }
  }

  ,styleApplier = [
    k => (k == 'style')

    ,(n ,k ,v) => {
      var cleanup

      if (typeof v == 'function') createImmediateEffect(() => (cleanup = applyStyle(n ,v())))
      else (cleanup = applyStyle(n ,v))

      if (cleanup) onCleanup(cleanup)
    }
  ]

  ,appliers = [
    inlineEventApplier
    
    ,eventApplier
    
    ,propertyApplier

    ,booleanApplier

    ,classApplier

    ,styleApplier
    
    ,/*Default*/attributeApplier
  ]

export var applyProp = (n ,k ,v) => appliers.find(([predict]) => predict(k ,v))?.[1]?.(n ,k ,v)
