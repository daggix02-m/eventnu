export const EMAIL_KEY = 'eventnu_auth_email'
export const PENDING_TERMS_KEY = 'eventnu_pending_terms'
export const PENDING_ACCOUNT_KEY = 'eventnu_pending_account_type'
export const PENDING_ORG_NAME_KEY = 'eventnu_pending_org_name'
export const PENDING_ORG_KIND_KEY = 'eventnu_pending_org_kind'
export const PENDING_ORG_BIO_KEY = 'eventnu_pending_org_bio'
export const PENDING_ORG_WEBSITE_KEY = 'eventnu_pending_org_website'
export const PENDING_ORG_CONTACT_EMAIL_KEY = 'eventnu_pending_org_contact_email'
export const PENDING_ORG_LOCATION_KEY = 'eventnu_pending_org_location'

export type OrganizerKind = 'organizer' | 'venue'

export interface PendingOrgData {
  accountType: 'organizer'
  orgName: string
  orgKind: OrganizerKind
  orgBio: string
  orgWebsite: string
  orgContactEmail: string
  orgLocation: string
}

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

export function storeEmail(mail: string): void {
  safeSet(EMAIL_KEY, mail.trim().toLowerCase())
}

export function getEmail(): string | null {
  return safeGet(EMAIL_KEY)
}

export function storePendingTerms(version: string): void {
  safeSet(PENDING_TERMS_KEY, version)
}

export function getPendingTerms(): string | null {
  return safeGet(PENDING_TERMS_KEY)
}

export function clearPendingTerms(): void {
  safeRemove(PENDING_TERMS_KEY)
}

export function storePendingOrg(data: PendingOrgData): void {
  safeSet(PENDING_ACCOUNT_KEY, data.accountType)
  safeSet(PENDING_ORG_NAME_KEY, data.orgName)
  safeSet(PENDING_ORG_KIND_KEY, data.orgKind)
  if (data.orgBio) safeSet(PENDING_ORG_BIO_KEY, data.orgBio)
  if (data.orgWebsite) safeSet(PENDING_ORG_WEBSITE_KEY, data.orgWebsite)
  if (data.orgContactEmail) safeSet(PENDING_ORG_CONTACT_EMAIL_KEY, data.orgContactEmail)
  if (data.orgLocation) safeSet(PENDING_ORG_LOCATION_KEY, data.orgLocation)
}

export function getPendingOrg(): PendingOrgData | null {
  const accountType = safeGet(PENDING_ACCOUNT_KEY)
  if (accountType !== 'organizer') return null
  return {
    accountType: 'organizer',
    orgName: safeGet(PENDING_ORG_NAME_KEY) ?? '',
    orgKind: (safeGet(PENDING_ORG_KIND_KEY) as OrganizerKind) ?? 'organizer',
    orgBio: safeGet(PENDING_ORG_BIO_KEY) ?? '',
    orgWebsite: safeGet(PENDING_ORG_WEBSITE_KEY) ?? '',
    orgContactEmail: safeGet(PENDING_ORG_CONTACT_EMAIL_KEY) ?? '',
    orgLocation: safeGet(PENDING_ORG_LOCATION_KEY) ?? '',
  }
}

export function clearPendingOrg(): void {
  safeRemove(PENDING_ACCOUNT_KEY)
  safeRemove(PENDING_ORG_NAME_KEY)
  safeRemove(PENDING_ORG_KIND_KEY)
  safeRemove(PENDING_ORG_BIO_KEY)
  safeRemove(PENDING_ORG_WEBSITE_KEY)
  safeRemove(PENDING_ORG_CONTACT_EMAIL_KEY)
  safeRemove(PENDING_ORG_LOCATION_KEY)
}

export function clearAllPending(): void {
  clearPendingOrg()
  clearPendingTerms()
}
