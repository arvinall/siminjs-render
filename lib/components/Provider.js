import {addContext} from '@siminjs/reaction'

export var Provider = ({children ,context ,value}) => (addContext(context() ,value()) ,children)
