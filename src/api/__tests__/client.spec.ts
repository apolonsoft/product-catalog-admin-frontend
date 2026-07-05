import { describe, it, expect } from 'vitest'
import { ApiError, parseError } from '../client'

describe('ApiError', () => {
  it('exposes message, name, and statusCode', () => {
    const error = new ApiError('Something went wrong', 418)

    expect(error.message).toBe('Something went wrong')
    expect(error.name).toBe('ApiError')
    expect(error.statusCode).toBe(418)
  })
})

describe('parseError', () => {
  it('uses body.message when the error response is JSON', async () => {
    const response = new Response(JSON.stringify({ message: 'Invalid credentials' }), {
      status: 401,
      statusText: 'Unauthorized',
    })

    const error = await parseError(response)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Invalid credentials')
    expect(error.statusCode).toBe(401)
  })

  it('falls back to statusText for non-JSON error bodies', async () => {
    const response = new Response('Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    const error = await parseError(response)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Request failed: Internal Server Error')
    expect(error.statusCode).toBe(500)
  })
})
