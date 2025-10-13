// @ts-ignore
import {JsonLdDocumentLoader} from 'jsonld-document-loader';
// @ts-ignore
import * as didContext from "did-context";
// @ts-ignore
import credentialsContext from "credentials-context";
import * as jsonld from "jsonld";
// @ts-ignore
import rdfCanonize from "@digitalcredentials/rdf-canonize";
// @ts-ignore
import dataIntegrityContext from '@digitalbazaar/data-integrity-context';
import { createHash, randomBytes } from "crypto";
import fs from "fs";
import {Command} from "commander";

// ---
function getDocumentLoader() {
  const loader = new JsonLdDocumentLoader();
  loader.addStatic(didContext.CONTEXT_URL_V1, didContext.contexts.get(didContext.CONTEXT_URL_V1))
  loader.addStatic(credentialsContext.CONTEXT_URL_V1, credentialsContext.contexts.get(credentialsContext.CONTEXT_URL_V1))
  loader.addStatic(
    dataIntegrityContext.constants.CONTEXT_URL,
    dataIntegrityContext.contexts.get(dataIntegrityContext.constants.CONTEXT_URL)
  );
  const dl = loader.build()
  return async (url: string) => {
    //console.log('url: ', url)
    return await dl(url)
  }

}

async function canonizeDirect(vc: unknown, documentLoader?: JsonLdDocumentLoader) {

  const dataset = await jsonld.toRDF(
    vc as any,
    { documentLoader, produceGeneralizedRdf: false })

  // Canonicalize the RDF dataset → normalized N-Quads
  const nquads: string = await rdfCanonize.canonize(dataset, {
    algorithm: "URDNA2015", // or "URDNA2015" (alias accepted by the lib)
    format: "application/n-quads",
  });

  return nquads;
}

/**
 * Canonicalize a VC (JSON-LD) to normalized N-Quads using URDNA2015 (RDFC-1.0),
 * then hash with SHA-256. Optionally salt before hashing for privacy.
 */
export async function canonAndHashVC(
  vc: unknown,
  opts?: {
    /** Provide a custom JSON-LD documentLoader to avoid network fetches for @context */
    documentLoader?: JsonLdDocumentLoader;
    /** If provided, prepend this salt (bytes) before hashing the canonical N-Quads */
    salt?: Uint8Array;
  }
): Promise<{ nquads: string; digestHex: string }> {
  const { documentLoader } = opts!;
  // 1) Canonicalize → normalized N-Quads string
  const nquads = await canonizeDirect(vc, documentLoader)

  // 2) Hash (optionally salted) → hex
  const hasher = createHash("sha256");
  if (opts?.salt) {
    hasher.update(Buffer.from(opts.salt));
  }
  hasher.update(nquads, "utf8");
  const digestHex = hasher.digest("hex");

  return { nquads, digestHex };
}

async function main() {
  const program = new Command();

  program
    .description("Canonize and hash a given VC (JSON-LD)")
    .requiredOption("--vc <string>", "Path to the VC.")
    .option("--outputCanonized <string>", "Path to canonized output.")
    .option("--outputHash <string>", "Path to output hash.")
    .parse(process.argv);

  const { vc, outputCanonized, outputHash } = program.opts()

  try {
    const vcObj = JSON.parse(fs.readFileSync(vc, 'utf8'))
    console.log('️⚠️ Using a default DocumentLoader')
    const dl = getDocumentLoader();
    const { nquads, digestHex } = await canonAndHashVC(vcObj, {documentLoader: dl})
    console.log('hash: ', digestHex)
    if(outputCanonized!!) {
      fs.writeFileSync(outputCanonized, nquads, {encoding: 'utf8'});
    }
    if(outputHash!!) {
      fs.writeFileSync(outputHash, digestHex, {encoding: 'utf8'});
    }
  } catch (error) {
    console.error('Error during the process:', error);
  }
}
main().then().catch(console.error);
