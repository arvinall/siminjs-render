export function createDepth (dest ,name ,fn) {
  var isDeep = false ,wasDeep = false

  return Object.defineProperty(dest ,name ,{
    configurable: true ,enumerable: true

    ,get () {
      wasDeep = isDeep
      
      if (!isDeep) ((isDeep = true) ,Promise.resolve().then(() => isDeep && (isDeep = false)))

      return wasDeep
        ? (...args) => fn(true ,...args)
        : (...args) => ((isDeep = false) ,fn(false ,...args))
    }
  })
}
