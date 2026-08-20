import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  EMAIL_KEY,
  PENDING_TERMS_KEY,
  PENDING_ACCOUNT_KEY,
  PENDING_ORG_NAME_KEY,
  storeEmail,
  getEmail,
  storePendingTerms,
  getPendingTerms,
  clearPendingTerms,
  storePendingOrg,
  getPendingOrg,
  clearPendingOrg,
  clearAllPending,
  type PendingOrgData,
} from './auth-storage'

const fullData: PendingOrgData = {
  accountType: 'organizer',
  orgName: 'Test Org',
  orgKind: 'venue',
  orgBio: 'A venue',
  orgWebsite: 'https://test.com',
  orgContactEmail: 'org@test.com',
  orgLocation: 'Addis',
}

describe('authStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('storeEmail / getEmail', () => {
    it('stores and retrieves email', () => {
      storeEmail('User@Example.com')
      expect(sessionStorage.getItem(EMAIL_KEY)).toBe('user@example.com')
      expect(getEmail()).toBe('user@example.com')
    })

    it('trims whitespace', () => {
      storeEmail('  test@foo.com  ')
      expect(getEmail()).toBe('test@foo.com')
    })

    it('returns null when nothing stored', () => {
      expect(getEmail()).toBeNull()
    })
  })

  describe('storePendingTerms / getPendingTerms / clearPendingTerms', () => {
    it('stores and retrieves terms version', () => {
      storePendingTerms('v2.0')
      expect(getPendingTerms()).toBe('v2.0')
    })

    it('clears pending terms', () => {
      storePendingTerms('v1')
      clearPendingTerms()
      expect(getPendingTerms()).toBeNull()
      expect(sessionStorage.getItem(PENDING_TERMS_KEY)).toBeNull()
    })
  })

  describe('storePendingOrg / getPendingOrg / clearPendingOrg', () => {
    it('stores and retrieves full organizer data', () => {
      storePendingOrg(fullData)
      const result = getPendingOrg()
      expect(result).toEqual(fullData)
    })

    it('returns null for non-organizer account type', () => {
      storePendingOrg(fullData)
      sessionStorage.setItem(PENDING_ACCOUNT_KEY, 'user')
      expect(getPendingOrg()).toBeNull()
    })

    it('returns null when no account type stored', () => {
      expect(getPendingOrg()).toBeNull()
    })

    it('handles missing optional fields', () => {
      storePendingOrg({
        accountType: 'organizer',
        orgName: 'Minimal',
        orgKind: 'organizer',
        orgBio: '',
        orgWebsite: '',
        orgContactEmail: '',
        orgLocation: '',
      })
      const result = getPendingOrg()
      expect(result?.orgName).toBe('Minimal')
      expect(result?.orgBio).toBe('')
      expect(result?.orgWebsite).toBe('')
    })

    it('clears all organizer keys', () => {
      storePendingOrg(fullData)
      clearPendingOrg()
      expect(getPendingOrg()).toBeNull()
      expect(sessionStorage.getItem(PENDING_ACCOUNT_KEY)).toBeNull()
      expect(sessionStorage.getItem(PENDING_ORG_NAME_KEY)).toBeNull()
    })
  })

  describe('clearAllPending', () => {
    it('clears both org and terms data', () => {
      storePendingOrg(fullData)
      storePendingTerms('v3')
      clearAllPending()
      expect(getPendingOrg()).toBeNull()
      expect(getPendingTerms()).toBeNull()
    })
  })

  describe('sessionStorage error handling', () => {
    it('does not throw when sessionStorage.setItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage not available')
      })
      expect(() => storeEmail('test@test.com')).not.toThrow()
      expect(() => storePendingTerms('v1')).not.toThrow()
      expect(() => storePendingOrg(fullData)).not.toThrow()
      spy.mockRestore()
    })

    it('does not throw when sessionStorage.getItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage not available')
      })
      expect(getEmail()).toBeNull()
      expect(getPendingTerms()).toBeNull()
      expect(getPendingOrg()).toBeNull()
      spy.mockRestore()
    })
  })
})
