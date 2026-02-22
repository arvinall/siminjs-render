import {getScope ,callBy ,createMemo ,untrack} from '@siminjs/reaction'

import {$ ,retrieveNodes ,rawPropsSymbol} from '../index.js'
import {env} from '../env.js'

export function Show ({children ,when ,fallback ,keyed ,[rawPropsSymbol]: rawProps}) {
  var
    show = createMemo(when)

    ,scope = getScope()
    
    ,nodes = children ,fragment

  if (keyed) nodes = () => (
    (rawProps.keyed ? keyed : show)()
    
    ,untrack(show) ? children : undefined
  )

  return () => (
    show()
      ? (
        fragment
          ? env.getChildren(fragment)
          : (
            callBy(scope ,() => (nodes = $.html`${nodes}`))

            ,(fragment = env.createFragment())

            ,nodes
          )
      )
      : (
        fragment && env.append(
          fragment
          
          ,...retrieveNodes(nodes[0] ?? nodes ,nodes[nodes.length - 1])
        )

        ,fallback?.()
      )
  )
}
