import {FromSchema} from "json-schema-to-ts";

console.log('index.ts')
import fastify from 'fastify'
import {Static, Type} from '@sinclair/typebox'

const ActorID = Type.String()
const ProductID = Type.String()
const Location = Type.String()
const ProductState = Type.Object({
  // productId: ProductID,
  quantity: Type.BigInt(),
  status: Type.String(), // currently we use Type.String(), TODO (later): use Enum
  // sender: ActorID,
  // recipient: ActorID,
  // from: Location,
  // to: Location,
})

const ProductSpec = Type.Object({
  productId: ProductID,
  name: Type.String(),
  foodType: Type.String(), // e.g., fruit, vegetable, meat, poultry
})

const server = fastify()
const querySchema = {
  type: 'object',
  properties: {
    productId: {type: 'string'}
  },
  required: ['productId']
} as const;

type QueryType = FromSchema<typeof querySchema>

server.get<{ Querystring: QueryType }>('/product', { schema: {querystring: querySchema}},
  async (request, reply) => {
    console.log(request.url)
    const {productId} = request.query
    console.log('productId', productId)
    // TODO: fetch product spec from Consortium Pod
    // TODO: add product spec to response
    return {productId}
});


server.post('/product', {schema: {body: ProductSpec}},
  async (request, reply) => {
    // TODO: register product at Consortium Pod
    // TODO: return ProductID
    return 'TODO'
  })

// server.post('/productstate', { schema: { body: ProductState }},
//   async (request, reply) => {
//   return 'TODO'
// })

server.listen({port: 8080}, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
