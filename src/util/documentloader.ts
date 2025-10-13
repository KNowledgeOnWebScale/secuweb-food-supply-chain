
// @ts-ignore
import * as didContext from "did-context";
// @ts-ignore
import credentialsContext from "credentials-context";

export interface DocumentLoaderResponse {
  contextUrl: null | string
  documentUrl: null | string
  document: unknown
}

export type IDocumentLoader = (url: string) => Promise<DocumentLoaderResponse>

export function createCustomDocumentLoader(preload: Map<string, any>): IDocumentLoader {
  // Predefined contexts
  const ctx = new Map();
  ctx.set(didContext.CONTEXT_URL_V1, didContext.contexts.get(didContext.CONTEXT_URL_V1))
  ctx.set(credentialsContext.CONTEXT_URL_V1, credentialsContext.contexts.get(credentialsContext.CONTEXT_URL_V1))

  // Add preloaded context entires to ctx
  preload.forEach((value,key)=>{
    ctx.set(key, value)
  })

  // Return document loader function
  return async (url: string) => {
    // console.log('url: ', url)
    const context = ctx.get(url);
    if (context !== undefined) {
      return {
        contextUrl: null,
        documentUrl: url,
        document: context
      }
    } else {
      throw new Error(`⚠️ context not found for ${url}`)
    }
  }
}