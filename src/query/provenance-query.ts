import { QueryEngine } from "@comunica/query-sparql";

type AuthenticatedFetch = typeof fetch;

export type TransportCompany = {
  actor: string;
  name: string;
  endpoint: string;
};

export type ProvenanceRow = {
  shipment: string;
  shipmentStatus?: string;
  event?: string;
  eventStatus?: string;
  startTime?: string;
  endTime?: string;
  receipt?: string;
  receiptStatus?: string;
  receiptTime?: string;
};

export type TransportEventRow = {
  event: string;
  eventStatus: string;
  startTime: string;
  endTime?: string;
  temperatureC: string;
};

export type GovernedResourceRegistration = {
  resource: string;
  resourceType: string;
  controller: string;
  responsibleProvider: string;
  intendedRole: string;
  accessPolicy: string;
};

export type DiscoveredResource = {
  manifest: string;
  controller: string;
  resource: string;
  resourceIdentifier: string;
  resourceType: string;
};

function sparqlIri(value: string): string {
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:[^\s<>"{}|\\^`]+$/.test(value)) {
    throw new Error(`Invalid IRI: ${value}`);
  }
  return `<${value}>`;
}

async function bindingsToRows(
  query: string,
  sources: string[],
  fetchFunction: AuthenticatedFetch
): Promise<Record<string, string>[]> {
  if (sources.length === 0) {
    return [];
  }
  const engine = new QueryEngine();
  const bindingsStream = await engine.queryBindings(query, {
    sources: sources as [string, ...string[]],
    fetch: fetchFunction,
    lenient: true,
  });
  const bindings = await bindingsStream.toArray();

  return bindings.map((binding) => {
    const row: Record<string, string> = {};
    for (const [variable, term] of binding) {
      row[variable.value] = term.value;
    }
    return row;
  });
}

export async function discoverCatalogSources(
  catalogUrl: string,
  fetchFunction: AuthenticatedFetch = fetch
): Promise<string[]> {
  const query = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?source WHERE {
      ?catalog rdfs:seeAlso ?source.
    }
    ORDER BY ?source
  `;
  const rows = await bindingsToRows(query, [catalogUrl], fetchFunction);
  return rows.map((row) => row.source);
}

export async function queryTransportCompanies(
  catalogUrl: string,
  fetchFunction: AuthenticatedFetch = fetch
): Promise<TransportCompany[]> {
  const query = `
    PREFIX ex: <http://example.org/terms#>
    PREFIX schema: <http://schema.org/>

    SELECT DISTINCT ?actor ?name ?endpoint WHERE {
      ?actor a ex:Transporter;
        schema:name ?name;
        ex:serviceEndpoint ?endpoint.
    }
    ORDER BY ?name
  `;
  const rows = await bindingsToRows(query, [catalogUrl], fetchFunction);
  return rows.map((row) => ({
    actor: row.actor,
    name: row.name,
    endpoint: row.endpoint,
  }));
}

export async function queryGovernedResourceRegistration(
  registrationUrl: string,
  shipmentIdentifier: string,
  intendedAgent: string,
  fetchFunction: AuthenticatedFetch
): Promise<GovernedResourceRegistration[]> {
  const query = `
    PREFIX ex: <http://example.org/terms#>
    PREFIX schema: <http://schema.org/>

    SELECT
      ?resource
      ?resourceType
      ?controller
      ?responsibleProvider
      ?intendedRole
      ?accessPolicy
    WHERE {
      ?registration
        a ex:GovernedResourceRegistration;
        schema:identifier ${JSON.stringify(shipmentIdentifier)};
        ex:registeredResource ?resource;
        ex:resourceType ?resourceType;
        ex:dataController ?controller;
        ex:responsibleProvider ?responsibleProvider;
        ex:intendedAgent ${sparqlIri(intendedAgent)};
        ex:intendedRole ?intendedRole;
        ex:accessPolicy ?accessPolicy;
        ex:governanceStatus "active".
    }
  `;
  const rows = await bindingsToRows(query, [registrationUrl], fetchFunction);
  return rows.map((row) => ({
    resource: row.resource,
    resourceType: row.resourceType,
    controller: row.controller,
    responsibleProvider: row.responsibleProvider,
    intendedRole: row.intendedRole,
    accessPolicy: row.accessPolicy,
  }));
}

export async function discoverBatchManifests(
  entryPointUrl: string,
  batchIdentifier: string,
  intendedAgent: string,
  fetchFunction: AuthenticatedFetch
): Promise<string[]> {
  const query = `
    PREFIX ex: <http://example.org/terms#>
    PREFIX schema: <http://schema.org/>

    SELECT DISTINCT ?manifest
    WHERE {
      ?entryPoint
        a ex:DiscoveryEntryPoint;
        schema:identifier ${JSON.stringify(batchIdentifier)};
        ex:discoveryScope ex:TransportationProvenance;
        ex:intendedAgent ${sparqlIri(intendedAgent)};
        ex:expectedManifestCount 4;
        ex:expectedResourceCount 8;
        ex:manifest ?manifest.
    }
    ORDER BY ?manifest
  `;
  const rows = await bindingsToRows(query, [entryPointUrl], fetchFunction);
  return rows.map((row) => row.manifest);
}

export async function discoverManifestResources(
  manifestUrls: string[],
  batchIdentifier: string,
  fetchFunction: AuthenticatedFetch
): Promise<DiscoveredResource[]> {
  const query = `
    PREFIX ex: <http://example.org/terms#>
    PREFIX schema: <http://schema.org/>

    SELECT DISTINCT
      ?manifest
      ?controller
      ?resource
      ?resourceIdentifier
      ?resourceType
    WHERE {
      ?manifest
        a ex:ResourceManifest;
        schema:identifier ${JSON.stringify(batchIdentifier)};
        ex:dataController ?controller;
        ex:resourceEntry ?entry.

      ?entry
        ex:resource ?resource;
        ex:resourceIdentifier ?resourceIdentifier;
        ex:resourceType ?resourceType.
    }
    ORDER BY ?resource
  `;
  const rows = await bindingsToRows(query, manifestUrls, fetchFunction);
  return rows.map((row) => ({
    manifest: row.manifest,
    controller: row.controller,
    resource: row.resource,
    resourceIdentifier: row.resourceIdentifier,
    resourceType: row.resourceType,
  }));
}

export async function queryActorDidBinding(
  webId: string,
  fetchFunction: AuthenticatedFetch = fetch
): Promise<string[]> {
  const query = `
    PREFIX owl: <http://www.w3.org/2002/07/owl#>

    SELECT DISTINCT ?did WHERE {
      ${sparqlIri(webId)} owl:sameAs ?did.
    }
  `;
  const rows = await bindingsToRows(query, [webId], fetchFunction);
  return rows.map((row) => row.did);
}

export async function queryBatchTransportationProvenance(
  batchDid: string,
  sources: string[],
  fetchFunction: AuthenticatedFetch
): Promise<ProvenanceRow[]> {
  const batchIri = sparqlIri(batchDid);
  const query = `
    PREFIX ex: <http://example.org/terms#>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX schema: <http://schema.org/>
    PREFIX epcis: <https://gs1.org/voc/>
    PREFIX vc: <https://www.w3.org/2018/credentials#>

    SELECT DISTINCT
      ?shipment ?shipmentStatus ?event ?eventStatus ?startTime ?endTime
      ?receipt ?receiptStatus ?receiptTime
    WHERE {
      {
        SELECT DISTINCT ?shipment WHERE {
          {
            ?batchVc a vc:VerifiableCredential;
              vc:credentialSubject ${batchIri}.
            ${batchIri} (prov:wasDerivedFrom|<prov:wasDerivedFrom>) ?shipmentRef.
            BIND(IRI(STR(?shipmentRef)) AS ?shipment)
          }
          UNION
          {
            ?shipmentVc a vc:VerifiableCredential;
              vc:credentialSubject ?shipment.
            ?shipment (ex:productID|<ex:productID>) ?batchRef.
            FILTER (STR(?batchRef) = STR(${batchIri}))
          }
        }
      }

      ?shipment (ex:status|<ex:status>) ?shipmentStatus.
      ?eventVc a vc:VerifiableCredential;
        vc:credentialSubject ?event.
      ?event (ex:shipmentID|<ex:shipmentID>) ?eventShipmentRef;
        (ex:status|<ex:status>) ?eventStatus;
        (schema:startTime|<schema:startTime>) ?startTime.
      FILTER (STR(?eventShipmentRef) = STR(?shipment))
      OPTIONAL {
        ?event (schema:endTime|<schema:endTime>) ?endTime.
      }
      OPTIONAL {
        SELECT DISTINCT ?shipment ?receipt ?receiptStatus ?receiptTime
        WHERE {
          ?receiptVc a vc:VerifiableCredential;
            vc:credentialSubject ?receipt.
          ?receipt (prov:used|<prov:used>) ?receiptShipmentRef;
            (schema:startTime|<schema:startTime>) ?receiptTime.
          BIND(IRI(STR(?receiptShipmentRef)) AS ?shipment)
          OPTIONAL {
            ?receipt (ex:status|<ex:status>|epcis:disposition|<epcis:disposition>)
              ?receiptStatus.
          }
        }
      }
    }
    ORDER BY ?shipment ?startTime
  `;
  const rows = await bindingsToRows(query, sources, fetchFunction);
  return rows.map((row) => ({
    shipment: row.shipment,
    shipmentStatus: row.shipmentStatus,
    event: row.event,
    eventStatus: row.eventStatus,
    startTime: row.startTime,
    endTime: row.endTime,
    receipt: row.receipt,
    receiptStatus: row.receiptStatus,
    receiptTime: row.receiptTime,
  }));
}

export async function queryTransportEventsForShipment(
  shipmentDid: string,
  sources: string[],
  fetchFunction: AuthenticatedFetch
): Promise<TransportEventRow[]> {
  const shipmentIri = sparqlIri(shipmentDid);
  const query = `
    PREFIX ex: <http://example.org/terms#>
    PREFIX schema: <http://schema.org/>
    PREFIX vc: <https://www.w3.org/2018/credentials#>

    SELECT DISTINCT ?event ?eventStatus ?startTime ?endTime ?temperatureC
    WHERE {
      ?eventVc a vc:VerifiableCredential;
        vc:credentialSubject ?event.
      ?event (ex:shipmentID|<ex:shipmentID>) ?shipmentRef;
        (ex:status|<ex:status>) ?eventStatus;
        (schema:startTime|<schema:startTime>) ?startTime;
        (ex:temperatureC|<ex:temperatureC>) ?temperatureC.
      FILTER (STR(?shipmentRef) = STR(${shipmentIri}))
      OPTIONAL {
        ?event (schema:endTime|<schema:endTime>) ?endTime.
      }
    }
    ORDER BY ?startTime
  `;
  const rows = await bindingsToRows(query, sources, fetchFunction);
  return rows.map((row) => ({
    event: row.event,
    eventStatus: row.eventStatus,
    startTime: row.startTime,
    endTime: row.endTime,
    temperatureC: row.temperatureC,
  }));
}
