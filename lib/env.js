export var
  env = {
    createText: undefined ,createElement: undefined ,createFragment: undefined
    
    ,append: undefined ,replace: undefined ,remove: undefined

    ,setAttribute: undefined ,removeAttribute: undefined

    ,isNode: undefined

    ,createMarker: undefined ,isMarker: undefined

    ,getNext: undefined ,getChildren: undefined

    ,addListener: undefined ,removeListener: undefined

    ,assignProp: undefined ,removeProp: undefined

    ,addClass: undefined ,removeClass: undefined

    ,setStyle: undefined ,removeStyle: undefined
  }

  ,provide = (n ,fn) => (env[n] = fn)
