// The credentials object returned by step2()
export interface ClientCredentials {
  /** Identifier for the generated client credential */
  id: string;
  /** Secret for the generated client credential (only returned once!) */
  secret: string;
  /** Resource URL that can be used to manage/delete the token later */
  resource: string;
}