import {suspenseContext ,createSignal ,createMemo} from '@siminjs/reaction'

import {Provider} from './Provider.js'
import {Show} from './Show.js'

import {$} from '../index.js'

var
  inc = x => x + 1
  ,dec = x => x ? (x - 1) : x

export function Suspense ({children ,fallback}) {
  var
    [dependents ,setDependents] = createSignal(0)

    ,ctx = {
      inc: () => setDependents(inc) ,dec: () => setDependents(dec)

      ,pending: !fallback && createMemo(() => Boolean(dependents()))
    }

    ,{pending} = ctx
    
    ,nodes = $.h(Provider ,{context: suspenseContext ,value: ctx} ,(
      fallback ? children : () => children(pending)
    ))

  return fallback
    ? $.h(Show ,{when: () => !dependents() ,fallback} ,nodes)
    : nodes

}
