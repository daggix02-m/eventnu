import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import type { NextjsOptions } from 'convex/nextjs'
import type { ArgsAndOptions, FunctionReference, FunctionReturnType } from 'convex/server'
import {
  fetchAction as baseFetchAction,
  fetchMutation as baseFetchMutation,
  fetchQuery as baseFetchQuery,
} from 'convex/nextjs'

const RETRYABLE_MESSAGES = [
  'Failed to fetch',
  'Network request failed',
  'fetch failed',
  'ECONNRESET',
  'ECONNABORTED',
  'Could not connect to the Convex deployment',
]

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return RETRYABLE_MESSAGES.some((msg) => err.message.includes(msg))
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt === 0 && isRetryable(err)) continue
      throw err
    }
  }
  throw lastErr
}

export async function fetchQuery<Q extends FunctionReference<'query'>>(
  query: Q,
  ...args: ArgsAndOptions<Q, NextjsOptions>
): Promise<FunctionReturnType<Q>> {
  const token = await convexAuthNextjsToken()
  const [fnArgs, options] = args
  return withRetry(() => baseFetchQuery(query, fnArgs, token ? { ...options, token } : options))
}

export async function fetchMutation<M extends FunctionReference<'mutation'>>(
  mutation: M,
  ...args: ArgsAndOptions<M, NextjsOptions>
): Promise<FunctionReturnType<M>> {
  const token = await convexAuthNextjsToken()
  const [fnArgs, options] = args
  return baseFetchMutation(mutation, fnArgs, token ? { ...options, token } : options)
}

export async function fetchAction<A extends FunctionReference<'action'>>(
  action: A,
  ...args: ArgsAndOptions<A, NextjsOptions>
): Promise<FunctionReturnType<A>> {
  const token = await convexAuthNextjsToken()
  const [fnArgs, options] = args
  return baseFetchAction(action, fnArgs, token ? { ...options, token } : options)
}
