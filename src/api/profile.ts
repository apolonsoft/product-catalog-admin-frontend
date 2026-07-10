import { API_BASE_URL, parseError } from './client'
import type { SafeUser } from './auth'

export interface UpdateProfilePayload {
  firstName?: string | null
  lastName?: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface InitiateAvatarUploadPayload {
  name: string
  type: string
  size: number
}

export interface InitiateAvatarUploadResponse {
  uploadId: string
  url: string
}

export async function updateProfile(
  token: string,
  payload: UpdateProfilePayload
): Promise<SafeUser> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json() as Promise<SafeUser>
}

export async function changePassword(
  token: string,
  payload: ChangePasswordPayload
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/profile/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await parseError(response)
  }
}

export async function initiateAvatarUpload(
  token: string,
  payload: InitiateAvatarUploadPayload
): Promise<InitiateAvatarUploadResponse> {
  const response = await fetch(`${API_BASE_URL}/profile/avatar/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json() as Promise<InitiateAvatarUploadResponse>
}

export async function uploadFileToUrl(url: string, file: File): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }
}

export async function completeAvatarUpload(
  token: string,
  uploadId: string
): Promise<SafeUser> {
  const response = await fetch(`${API_BASE_URL}/profile/avatar/uploads/${uploadId}/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json() as Promise<SafeUser>
}
