import * as util from 'node:util'
export function log(x: any) {
  console.log(util.inspect(x,{showHidden: false, depth: null, colors: true}))
}
