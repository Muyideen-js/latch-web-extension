import type {
  BackgroundMessage,
  MigrationDiscoverRequest,
  MigrationSweepTokenRequest,
  MigrationSweepXlmRequest,
} from '@latch/types'

import type { OkFn } from '../messageResponse'
import { runMigrationDiscover } from './discover'
import { runMigrationSweepToken, runMigrationSweepXlm } from './sweep'

/** Returns true if the message type was handled. */
export async function tryHandleMigrationMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'MIGRATION_DISCOVER': {
      const req = message.payload as MigrationDiscoverRequest
      const data = await runMigrationDiscover(req.accountId)
      sendResponse(ok(data))
      return true
    }

    case 'MIGRATION_SWEEP_XLM': {
      const req = message.payload as MigrationSweepXlmRequest
      const data = await runMigrationSweepXlm(req.accountId, req.pendingTokenSweepCount ?? 0)
      sendResponse(ok(data))
      return true
    }

    case 'MIGRATION_SWEEP_TOKEN': {
      const req = message.payload as MigrationSweepTokenRequest
      const data = await runMigrationSweepToken(req.accountId, req.sacContractId)
      sendResponse(ok(data))
      return true
    }

    default:
      return false
  }
}
