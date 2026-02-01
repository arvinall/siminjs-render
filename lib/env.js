export var
  env = {
    createText: undefined ,updateText: undefined
    
    ,createElement: undefined
    
    ,append: undefined ,replace: undefined ,remove: undefined
  }
  
  ,provide = (n ,fn) => (env[n] = fn)
