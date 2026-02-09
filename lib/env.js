export var
  env = {
    createText: undefined ,updateText: undefined
    
    ,createElement: undefined
    
    ,append: undefined ,replace: undefined ,remove: undefined

    ,setAttribute: undefined ,removeAttribute: undefined

    ,isNode: undefined

    ,createMarker: undefined ,isMarker: undefined

    ,getNext: undefined
  }
  
  ,provide = (n ,fn) => (env[n] = fn)
