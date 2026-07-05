export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = 'ApiError'
  }
}

export async function parseError(response: Response): Promise<ApiError> {
  let message = `Request failed: ${response.statusText}`
  try {
    const body = (await response.json()) as { message?: string }
    if (body.message) {
      message = body.message
    }
  } catch {
    // ignore non-JSON error bodies
  }
  return new ApiError(message, response.status)
}
