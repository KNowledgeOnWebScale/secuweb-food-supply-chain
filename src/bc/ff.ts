import FireFly, {FireFlyBroadcastMessageRequest, FireFlyMessageFilter} from "@hyperledger/firefly-sdk";
import {config} from './config'
import {log} from "../util/log";

async function getMessagesByTag(tag: string, ffi: FireFly, ffs: FireFly[]) {
  const msgFilter: FireFlyMessageFilter = {tag}
  const msgsForTag = await ffi.getMessages(msgFilter)
  console.log(`Messages (filtered by tag: "${tag}) (count: ${msgsForTag.length})":`)
  console.log('ffs[1] --> ', (await ffs[1].getMessages(msgFilter)).length)
}

async function main() {
  const ffs = config.members.map(({host, namespace}) => new FireFly({host, namespace}))
  console.log('Nr of FireFly instances (members): ', ffs.length)


  // FireFly instance
  const ffi = ffs[0]

  // Get organizations
  const orgs = await ffi.getOrganizations()
  console.log(orgs)

  // Get messages
  const msgs = await ffi.getMessages()
  console.log(msgs)

  // Get messages, filtered by tag
  const tag = 'shipment'
  await getMessagesByTag(tag, ffi, ffs);

  // Write message
  const tagDev = 'dev'
  const msgReq : FireFlyBroadcastMessageRequest = {
    header: { tag: tagDev },
    data: [ { value: 'this is a test message' } ]

  }
  console.log(msgReq)
  const msgRes = await ffi.sendBroadcast(msgReq)
  console.log(msgRes)

  // Get this newly created message from the chain
  const msgById = await ffi.getMessages({id: msgRes.header.id})
  log({msgById})
  // Get the corresponding message data
  const msgData = await ffi.getData(msgById[0].data[0].id!)
  log({msgData})

}
main().then().catch(console.error)
