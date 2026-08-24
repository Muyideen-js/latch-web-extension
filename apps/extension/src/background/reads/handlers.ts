import type {
  BackgroundMessage,
  GetAssetIconDataUrlsRequest,
  GetMarketPricesRequest,
  GetMarketPricesResponse,
  GetSmartAccountBalancesRequest,
  GetSmartAccountTransactionsRequest,
  RecordKnownSacProbeRequest,
} from '@latch/types'

import { getAssetIconDataUrlsBatch } from '../assetIcons'
import { recordKnownSacProbe } from '../knownSacProbes'
import { getMarketPrices } from '../marketPrices'
import type { OkFn } from '../messageResponse'
import { runGetSmartAccountBalances } from '../smartAccountBalances'
import { runGetSmartAccountTransactions } from '../smartAccountTransactions'

/** Returns true if the message type was handled. */
export async function tryHandleReadsMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'GET_SMART_ACCOUNT_BALANCES': {
      const req = message.payload as GetSmartAccountBalancesRequest
      const data = await runGetSmartAccountBalances(req.accountId)
      sendResponse(ok(data))
      return true
    }

    case 'GET_SMART_ACCOUNT_TRANSACTIONS': {
      const req = message.payload as GetSmartAccountTransactionsRequest
      const data = await runGetSmartAccountTransactions(req.accountId, {
        force: req.force === true,
      })
      sendResponse(ok(data))
      return true
    }

    case 'GET_MARKET_PRICES': {
      const req = message.payload as GetMarketPricesRequest
      const data = await getMarketPrices(req.tokens ?? [])
      const payload: GetMarketPricesResponse = {
        updatedAtMs: data.updatedAtMs,
        pricesByCodeUpper: Object.fromEntries(
          Object.entries(data.pricesByCodeUpper).map(([k, v]) => [k, v] as const)
        ),
      }
      sendResponse(ok(payload))
      return true
    }

    case 'GET_ASSET_ICON_DATA_URLS': {
      const req = message.payload as GetAssetIconDataUrlsRequest
      const data = await getAssetIconDataUrlsBatch(req)
      sendResponse(ok(data))
      return true
    }

    case 'RECORD_KNOWN_SAC_PROBE': {
      const req = message.payload as RecordKnownSacProbeRequest
      await recordKnownSacProbe(req.accountId, req.probe)
      sendResponse(ok(undefined))
      return true
    }

    default:
      return false
  }
}
