import { describe, it, expect, beforeEach, vi } from 'vitest'
import { API_BASE_URL } from '../client'
import * as profileApi from '../profile'

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn<() => Promise<Response>>().mockResolvedValue(response))
}

function getFetchCall(fetchMock: ReturnType<typeof vi.fn>, index: number) {
  const call = fetchMock.mock.calls[index]
  expect(call).toBeDefined()
  return call as [string | URL | Request, RequestInit | undefined]
}

const mockUser = {
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  role: 'ADMIN',
  status: 'ACTIVE',
  avatarFileId: null,
  avatarFile: null,
}

describe('profile API', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  describe('updateProfile', () => {
    it('sends a bearer token and JSON body', async () => {
      mockFetch(new Response(JSON.stringify(mockUser), { status: 200 }))

      await profileApi.updateProfile('token-123', { firstName: 'Ada', lastName: 'Lovelace' })

      const fetchMock = vi.mocked(fetch)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = getFetchCall(fetchMock, 0)
      expect(url).toBe(`${API_BASE_URL}/profile`)
      expect(init?.method).toBe('PATCH')
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer token-123',
        'Content-Type': 'application/json',
      })
      expect(init?.body).toBe(JSON.stringify({ firstName: 'Ada', lastName: 'Lovelace' }))
    })

    it('throws an ApiError using parseError on failure', async () => {
      mockFetch(new Response(JSON.stringify({ message: 'Invalid profile data' }), { status: 400 }))

      await expect(
        profileApi.updateProfile('token-123', { firstName: 'Ada' })
      ).rejects.toThrow('Invalid profile data')
    })
  })

  describe('changePassword', () => {
    it('handles 204 No Content', async () => {
      mockFetch(new Response(null, { status: 204 }))

      await expect(
        profileApi.changePassword('token-123', { currentPassword: 'old', newPassword: 'new-password' })
      ).resolves.toBeUndefined()

      const fetchMock = vi.mocked(fetch)
      const [url, init] = getFetchCall(fetchMock, 0)
      expect(url).toBe(`${API_BASE_URL}/profile/password`)
      expect(init?.method).toBe('PATCH')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer token-123' })
    })

    it('throws an ApiError on failure', async () => {
      mockFetch(new Response(JSON.stringify({ message: 'Current password is incorrect' }), { status: 401 }))

      await expect(
        profileApi.changePassword('token-123', { currentPassword: 'wrong', newPassword: 'new-password' })
      ).rejects.toThrow('Current password is incorrect')
    })
  })

  describe('avatar upload', () => {
    it('initiates upload with file metadata', async () => {
      mockFetch(
        new Response(JSON.stringify({ uploadId: 'upload-1', url: 'https://signed.example/put' }), {
          status: 200,
        })
      )

      const result = await profileApi.initiateAvatarUpload('token-123', {
        name: 'avatar.png',
        type: 'image/png',
        size: 24512,
      })

      expect(result).toEqual({ uploadId: 'upload-1', url: 'https://signed.example/put' })
      const fetchMock = vi.mocked(fetch)
      const [url, init] = getFetchCall(fetchMock, 0)
      expect(url).toBe(`${API_BASE_URL}/profile/avatar/uploads`)
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer token-123' })
      expect(init?.body).toBe(JSON.stringify({ name: 'avatar.png', type: 'image/png', size: 24512 }))
    })

    it('uploads file bytes to the presigned URL with Content-Type', async () => {
      mockFetch(new Response(null, { status: 200 }))

      const file = new File(['binary-content'], 'avatar.png', { type: 'image/png' })
      await profileApi.uploadFileToUrl('https://signed.example/put', file)

      const fetchMock = vi.mocked(fetch)
      const [url, init] = getFetchCall(fetchMock, 0)
      expect(url).toBe('https://signed.example/put')
      expect(init?.method).toBe('PUT')
      expect(init?.headers).toMatchObject({ 'Content-Type': 'image/png' })
      expect(init?.body).toBe(file)
    })

    it('completes the upload and returns the updated user', async () => {
      mockFetch(new Response(JSON.stringify(mockUser), { status: 200 }))

      const result = await profileApi.completeAvatarUpload('token-123', 'upload-1')

      expect(result).toEqual(mockUser)
      const fetchMock = vi.mocked(fetch)
      const [url, init] = getFetchCall(fetchMock, 0)
      expect(url).toBe(`${API_BASE_URL}/profile/avatar/uploads/upload-1/complete`)
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer token-123' })
    })

    it('throws an ApiError when initiation fails', async () => {
      mockFetch(new Response(JSON.stringify({ message: 'Invalid file type' }), { status: 400 }))

      await expect(
        profileApi.initiateAvatarUpload('token-123', { name: 'avatar.gif', type: 'image/gif', size: 1000 })
      ).rejects.toThrow('Invalid file type')
    })
  })
})
