import jsonld from 'jsonld';

export async function expandJsonLd(input: object): Promise<object[]> {
    return await jsonld.expand(input);
}