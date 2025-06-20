import {config} from './config'
import {FromSchema} from "json-schema-to-ts";
import fastify from 'fastify'
import {Type} from '@sinclair/typebox'
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui'
import {TypeBoxTypeProvider} from "@fastify/type-provider-typebox";

/**
 * Type definitions
 */
const ActorID = Type.String()
const ProductID = Type.String()
const Location = Type.String()
const ProductState = Type.Object({
  productId: ProductID,
  quantity: Type.Number(),
  status: Type.String(), // currently we use Type.String(), TODO (later): use Enum
  sender: ActorID,
  recipient: ActorID,
  from: Location,
  to: Location,
})

const ProductSpec = Type.Object({
  productId: ProductID,
  name: Type.String(),
})


const querySchema = {
  type: 'object',
  properties: {
    productId: {type: 'string'}
  },
  required: ['productId']
} as const;

type QueryType = FromSchema<typeof querySchema>

async function main() {
  const server = fastify()
    .withTypeProvider<TypeBoxTypeProvider>()

  // Register swagger plugins
  await server.register(swagger, {swagger: { info: { title: 'FSC API', version: '1.0.0' } }})
  await server.register(swaggerUI, {routePrefix: '/docs'})

  /**
   * Endpoints
   */
  server.get<{ Querystring: QueryType }>('/product', {schema: {querystring: querySchema}},
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
    });

  server.post('/productstate', {schema: {body: ProductState}},
    async (request, reply) => {
      // TODO: add transaction to BC to update product state
      // TODO: return transaction ID?
      return 'TODO'
    })

  server.listen({port: config.server.port}, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`Server listening at ${address}`)
  })
}
main().then().catch(console.error)
