import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import type { NextjsOptions } from "convex/nextjs"
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
} from "convex/server"
import {
  fetchAction as baseFetchAction,
  fetchMutation as baseFetchMutation,
  fetchQuery as baseFetchQuery,
} from "convex/nextjs"

export async function fetchQuery<Q extends FunctionReference<"query">>(
  query: Q,
  ...args: ArgsAndOptions<Q, NextjsOptions>
): Promise<FunctionReturnType<Q>> {
  const token = await convexAuthNextjsToken()
  const [fnArgs, options] = args
  return baseFetchQuery(query, fnArgs, token ? { ...options, token } : options)
}

export async function fetchMutation<M extends FunctionReference<"mutation">>(
  mutation: M,
  ...args: ArgsAndOptions<M, NextjsOptions>
): Promise<FunctionReturnType<M>> {
  const token = await convexAuthNextjsToken()
  const [fnArgs, options] = args
  return baseFetchMutation(
    mutation,
    fnArgs,
    token ? { ...options, token } : options,
  )
}

export async function fetchAction<A extends FunctionReference<"action">>(
  action: A,
  ...args: ArgsAndOptions<A, NextjsOptions>
): Promise<FunctionReturnType<A>> {
  const token = await convexAuthNextjsToken()
  const [fnArgs, options] = args
  return baseFetchAction(action, fnArgs, token ? { ...options, token } : options)
}
