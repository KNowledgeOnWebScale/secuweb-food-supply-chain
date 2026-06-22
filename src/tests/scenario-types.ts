export type AuthenticatedFetch = typeof fetch;

export type CheckResult = {
  id: string;
  scenario: string;
  description: string;
  passed: boolean;
  skipped: boolean;
  detail: string;
};

export type VerificationResponse = {
  verified?: boolean;
  anchor?: {
    vcHash?: string;
    subjectDid?: string;
    issuerDid?: string;
    issuer?: string;
    metadataURI?: string;
    timestamp?: number;
  } | null;
  error?: unknown;
};

export type ExplorerDidRow = {
  did: string;
  controller: string;
  docHash?: string;
  active: boolean;
};

export type ExplorerData = {
  dids?: ExplorerDidRow[];
};

export type CredentialFixture = {
  response: Response;
  text: string;
  credential: Record<string, any>;
};

export type ScenarioContext = {
  evidenceDir: string;
  repoRoot: string;
  isDeniedStatus: (status: number) => boolean;
  asObject: (value: unknown, label: string) => Record<string, any>;
  linkedIdentifier: (value: unknown) => string | undefined;
  getActorFetch: (actorName: string) => Promise<AuthenticatedFetch>;
  getOriginalCredential: () => Promise<CredentialFixture>;
  fetchCredential: (authFetch: AuthenticatedFetch, url: string) => Promise<CredentialFixture>;
  fetchJsonResource: (authFetch: AuthenticatedFetch, url: string, label: string) => Promise<Record<string, any>>;
  verifyOnChain: (credential: Record<string, any>) => Promise<VerificationResponse>;
  getExplorerData: () => Promise<ExplorerData>;
  runVcCli: (inputFile: string, configFile: string) => Promise<{ exitCode: number; output: string }>;
};

type SkippedCheck = {
  id: string;
  scenario: string;
  description: string;
  skip: true;
};

type RunnableCheck = {
  id: string;
  scenario: string;
  description: string;
  skip?: false;
  run: (context: ScenarioContext) => Promise<string>;
};

export type ScenarioCheck = SkippedCheck | RunnableCheck;
