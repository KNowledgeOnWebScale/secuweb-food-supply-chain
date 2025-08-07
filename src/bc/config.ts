
const baseUrl = 'http://localhost'
const members = [
  {port: 10000, host: baseUrl},
  {port: 10001, host: baseUrl},
].map((r: any)=>{
  r = { ...r, host: `${baseUrl}:${r.port}` }
  r['api'] = `${r.host}/api/v1`
  r['namespace'] = 'default'
  return r
})
export const config = {
  members
}
