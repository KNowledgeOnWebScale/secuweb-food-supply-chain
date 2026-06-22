export type PublicationType = "verifiableCredential" | "rawJsonLd";

export type ManifestGrant = {
  agent: string;
  read: boolean;
};

export type ManifestResource = {
  id: string;
  owner: string;
  source: string;
  podPath: string;
  publication: PublicationType;
  subjectDid?: string;
  catalog: boolean;
  anchor: boolean;
  grants: ManifestGrant[];
  scenarioTags?: string[];
};

export type Manifest = {
  id: string;
  actors: string[];
  resources: ManifestResource[];
};
