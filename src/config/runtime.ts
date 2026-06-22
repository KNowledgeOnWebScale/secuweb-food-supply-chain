export const defaultCssBaseUrl = "http://localhost:3000";
export const defaultVerifierBaseUrl = "http://localhost:4444";

export function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized) {
    throw new Error("Base URL must not be empty");
  }
  return normalized;
}

export const cssBaseUrl = normalizeBaseUrl(
  process.env.CSS_BASE_URL || defaultCssBaseUrl
);

export const verifierBaseUrl = normalizeBaseUrl(
  process.env.VERIFIER_BASE_URL || defaultVerifierBaseUrl
);

export function withTrailingSlash(value: string): string {
  return `${normalizeBaseUrl(value)}/`;
}

export function actorPodUrl(actor: string): string {
  return `${cssBaseUrl}/${actor}`;
}

export function actorContainerUrl(actor: string, containerPath = ""): string {
  const normalizedContainerPath = containerPath.replace(/^\/+|\/+$/g, "");
  return normalizedContainerPath
    ? `${actorPodUrl(actor)}/${normalizedContainerPath}/`
    : `${actorPodUrl(actor)}/`;
}

export function resourceUrl(actor: string, resourcePath: string): string {
  return `${actorPodUrl(actor)}/${resourcePath.replace(/^\/+/, "")}`;
}

export function webId(actor: string): string {
  return resourceUrl(actor, "profile/card#me");
}
