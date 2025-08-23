export /**
 * Spec: https://solid.github.io/specification/protocol#writing-resources
 * @param url
 * @param where
 * @param inserts
 * @param deletes
 * @param prefixes
 */
async function n3patch(
  fetch: Function,
              url: string,
              where?: string,
              inserts?: string,
              deletes?: string,
              prefixes?: Record<string, string>
) {

    const clauses = [
        where ? `solid:where { ${where} }` : where,
        inserts ? `solid:inserts { ${inserts} }` : inserts,
        deletes ? `solid:deletes { ${deletes} }` : deletes,
    ].filter(c => c!!).join(';\n')


    const n3Patch = `
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    ${
        prefixes! ? Object.entries(prefixes!).map(([p, ns]) => `@prefix ${p}: <${ns}> .`).join('\n') : ''
    }
    
    _:rename a solid:InsertDeletePatch;
        ${clauses}
    .
    `

    const response = await fetch(
        url,
        {
            method: 'PATCH',
            headers: {
                'content-type': "text/n3"
            },
            body: n3Patch
        }
    )

    const {ok, status, statusText} = response
    if (!ok)
        throw new Error(`
        N3 Patch failed.
        Url: ${url}
        Status: ${status} - ${statusText}
        N3 Patch:\n${n3Patch}
        `)

}