import type {
  BackgroundMessage,
  CreateDepositIntentRequest,
  DepositIntent,
  GetDepositIntentStatusRequest,
} from '@latch/types'

import { BackendError } from '../api/client'
import { createDepositIntent, fetchDepositIntentStatus } from '../api/deposit'
import { openMoonPayBuyTab } from '../../lib/moonpayBuyUrl'
import { openTransakBuyTab } from '../../lib/transakBuyUrl'
import { resolveAccessToken } from '../api/v1Client'
import { v1AuthWalletForLinkedAccount } from '../cosign/v1AuthWallet'
import { getActiveNetwork } from '../network/config'
import { getAccounts } from '../storage'
import type { OkFn } from '../messageResponse'

const FUNDABLE_MODES = new Set(['passkey', 'freighter', 'mnemonic', 'phantom'])

function signedWidgetUrlFromIntent(intent: DepositIntent): string | undefined {
  const raw = intent.widget_url?.trim() || intent.widgetUrl?.trim()
  return raw || undefined
}

export function assertDepositIntent(intent: DepositIntent): DepositIntent {
  const memoId = intent?.memo_id?.trim()
  const poolAddress = intent?.pool_address?.trim()
  const intentId = intent?.intent_id?.trim()
  if (!memoId || !poolAddress || !intentId) {
    throw new BackendError('Deposit intent response missing memo_id, pool_address, or intent_id', {
      status: 502,
      code: 'invalid_deposit_intent',
    })
  }
  const widgetUrl = signedWidgetUrlFromIntent(intent)
  return {
    intent_id: intentId,
    memo_id: memoId,
    pool_address: poolAddress,
    expires_at: intent.expires_at,
    ...(widgetUrl
      ? {
          widget_url: widgetUrl,
          widgetUrl,
        }
      : {}),
  }
}

function mapMoonPayOpenError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err)
  if (/live keys cannot be used while the wallet is on testnet/i.test(message)) {
    throw new BackendError(message, { code: 'moonpay_network_mismatch', status: 400 })
  }
  if (/require a server-signed signature/i.test(message)) {
    throw new BackendError(message, { code: 'moonpay_unsigned_url', status: 400 })
  }
  throw err instanceof Error ? err : new Error(message)
}

export async function tryHandleDepositMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'CREATE_DEPOSIT_INTENT': {
      const req = message.payload as CreateDepositIntentRequest
      if (req.openMoonPay && req.openTransak) {
        throw new BackendError('Choose a single on-ramp provider', {
          status: 400,
          code: 'fund_provider_conflict',
        })
      }
      if (req.openTransak) {
        const crypto = req.cryptoCurrency
        if (crypto !== 'XLM' && crypto !== 'USDC') {
          throw new BackendError('Transak requires cryptoCurrency XLM or USDC', {
            status: 400,
            code: 'transak_crypto_required',
          })
        }
      }

      const { accounts } = await getAccounts()
      const account = accounts.find((a) => a.id === req.accountId)
      if (!account) {
        throw new BackendError('Account not found', { status: 404, code: 'no_account' })
      }
      if (!FUNDABLE_MODES.has(account.mode)) {
        throw new BackendError('Fund via on-ramp is not available for this account type yet.', {
          status: 400,
          code: 'fund_unsupported_mode',
        })
      }
      const smartAccountAddress = account.smartAccountAddress?.trim()
      if (!smartAccountAddress) {
        throw new BackendError('Account missing smart account address', {
          status: 400,
          code: 'no_smart_account',
        })
      }

      const { wallet } = v1AuthWalletForLinkedAccount(account)
      await resolveAccessToken(wallet)

      const provider = req.openTransak ? 'transak' : req.openMoonPay ? 'moonpay' : undefined
      const intent = assertDepositIntent(
        await createDepositIntent(wallet, smartAccountAddress, {
          provider,
          cryptoCurrency: req.openTransak ? req.cryptoCurrency : undefined,
        })
      )

      if (req.openMoonPay) {
        const network = await getActiveNetwork()
        try {
          await openMoonPayBuyTab({
            poolAddress: intent.pool_address,
            memoId: intent.memo_id,
            intentId: intent.intent_id,
            widgetUrl: signedWidgetUrlFromIntent(intent),
            network,
          })
        } catch (err) {
          mapMoonPayOpenError(err)
        }
      }

      if (req.openTransak) {
        const widgetUrl = signedWidgetUrlFromIntent(intent)
        if (!widgetUrl) {
          throw new BackendError(
            'Transak did not return a widget URL. The Latch API must create a Transak session and return widget_url.',
            { code: 'transak_missing_widget_url', status: 400 }
          )
        }
        await openTransakBuyTab({ widgetUrl })
      }

      sendResponse(ok(intent))
      return true
    }
    case 'GET_DEPOSIT_INTENT_STATUS': {
      const req = message.payload as GetDepositIntentStatusRequest
      const { accounts } = await getAccounts()
      const account = accounts.find((a) => a.id === req.accountId)
      if (!account) {
        throw new BackendError('Account not found', { status: 404, code: 'no_account' })
      }
      const { wallet } = v1AuthWalletForLinkedAccount(account)
      const status = await fetchDepositIntentStatus(wallet, req.memoId)
      sendResponse(ok(status))
      return true
    }
    default:
      return false
  }
}
