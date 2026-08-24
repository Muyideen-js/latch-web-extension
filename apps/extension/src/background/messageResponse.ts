import type { BackgroundResponse, SerializableError } from '@latch/types'

import { BackendError } from './api/client'

export type OkFn = (data?: unknown) => { ok: boolean; data?: unknown }

export function ok<T>(data?: T): BackgroundResponse<T> {
  return { ok: true, data }
}

export function toSerializableError(err: unknown): SerializableError {
  if (err instanceof BackendError) return err.toSerializable()
  if (err instanceof Error) return { message: err.message }
  return { message: String(err) }
}
