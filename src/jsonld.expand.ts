import { assert } from "console";

const {expandJsonLd } = require('./util/jsonld');

// Extract path from process arguments
assert (process.argv.length > 3, 'Please provide the path to the VC JSON-LD file as a command line argument.');
const vcPath = process.argv[2]
const outputPath = process.argv[3]

expandJsonLd(
    JSON.parse(
        require('fs').readFileSync(vcPath, 'utf-8')
    )
).then((result: object[]) => {
    // Expand the JSON-LD document and extract the credential subject ID
    assert(result.length === 1)
    const [expandedVc] = result;
    const cs = (expandedVc as any)['https://www.w3.org/2018/credentials#credentialSubject'];
    const csId = cs[0]['@id'];
    const podRef = cs[0]['http://schema.org/url'][0]['@value'];
    assert(!!csId, 'Credential Subject ID not found in the expanded JSON-LD document.');
    assert(!!podRef, 'Pod Reference URL not found in the expanded JSON-LD document.');
    require('fs').writeFileSync(outputPath, JSON.stringify({
        credentialSubjectId: csId,
        podRef: podRef
    }, null, 2));
})

.catch(console.error);