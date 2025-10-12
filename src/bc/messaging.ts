import {config} from "./config";
import FireFly, {FireFlyBroadcastMessageRequest, FireFlyMessageFilter} from "@hyperledger/firefly-sdk";
import {log} from "../util/log";

export async function broadcastMessage(
  authorDID: string,
  keyAddress: string,
  tag: string,
  topic: string,
  payload: string
) {
  const ffs = config.members.map(({host, namespace}) => new FireFly({host, namespace}))
  // FireFly instance
  const ffi = ffs[0]

  const msgReq: FireFlyBroadcastMessageRequest = {
    header: {
      author: authorDID,
      key: keyAddress, // key: The on-chain signing key used to sign the transaction
      tag,
      topics: [topic]
    },
    data: [{value: payload}]
  }

  const msgRes = await ffi.sendBroadcast(msgReq)

  // Get this newly created message from the chain
  const msgById = await ffi.getMessages({id: msgRes.header.id})
  log({msgById})
  // Get the corresponding message data
  const msgData = await ffi.getData(msgById[0].data[0].id!)
  log({msgData})
}

export async function fetchMessage(
  tag: string,
  topics: string,
  author?: string
) {
  const ffs = config.members.map(({host, namespace}) => new FireFly({host, namespace}))
  // FireFly instance
  const ffi = ffs[0]

  const msgFilter: FireFlyMessageFilter = {author, tag, topics }
  return await ffi.getMessages(msgFilter )
}