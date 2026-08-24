import type { BackgroundMessage } from '@latch/types'

import { BackendError } from '../api/client'
import {
  completeWalletSignInFromAssertion,
  requestWalletChallenge,
  resolveAccessToken,
} from '../api/v1Client'
import { v1AuthWalletForLinkedAccount } from '../cosign/v1AuthWallet'
import { getActiveNetwork } from '../network/config'
import { getAccounts } from '../storage'
import type { OkFn } from '../messageResponse'

/**
 * Handles V1 JWT ensure / challenge / sign-in messages (shared by Fund and cosign UI).
 *
 * Challenge is ONLY `POST /v1/auth/challenge` — do not call `/api/webauthn/authentication/begin`.
 * That begin route is a cookie-session WebAuthn ceremony; V1 wallet sign-in uses the challenge
 * nonce directly as the WebAuthn challenge (see passkeyAuthenticationOptionsForV1Challenge).
 */
export async function tryHandleV1AuthMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'COSIGN_ENSURE_V1_AUTH': {
      const req = message.payload as { linkedAccountId: string }
      const { accounts } = await getAccounts()
      const linked = accounts.find((a) => a.id === req.linkedAccountId)
      if (!linked) throw new Error('Linked account not found')
      const { wallet } = v1AuthWalletForLinkedAccount(linked)
      await resolveAccessToken(wallet)
      sendResponse(ok({ ok: true }))
      return true
    }
    case 'COSIGN_V1_AUTH_CHALLENGE': {
      const req = message.payload as { linkedAccountId: string }
      const { accounts } = await getAccounts()
      const linked = accounts.find((a) => a.id === req.linkedAccountId)
      if (!linked) throw new Error('Linked account not found')
      const { wallet, keyType } = v1AuthWalletForLinkedAccount(linked)
      const challenge = await requestWalletChallenge(wallet, keyType)
      const nonce = String(challenge.nonce ?? challenge.challenge ?? '').trim()
      if (!nonce) throw new Error('V1 auth challenge missing nonce')

      const active = await getActiveNetwork()
      const issued =
        typeof challenge.network === 'string' ? challenge.network.trim().toLowerCase() : ''
      if (issued === 'mainnet' || issued === 'testnet') {
        if (issued !== active) {
          throw new BackendError(
            `Latch API issued a ${issued} challenge while the wallet is on ${active}.`,
            { code: 'network_mismatch', status: 409 }
          )
        }
      }

      sendResponse(ok({ wallet, nonce, keyType, network: active }))
      return true
    }
    case 'COSIGN_V1_AUTH_SIGN_IN': {
      const req = message.payload as {
        linkedAccountId: string
        wallet: string
        keyType: string
        nonce: string
        response: unknown
      }
      const { accounts } = await getAccounts()
      const linked = accounts.find((a) => a.id === req.linkedAccountId)
      if (!linked) throw new Error('Linked account not found')
      await completeWalletSignInFromAssertion({
        wallet: req.wallet,
        keyType: req.keyType,
        nonce: req.nonce,
        assertion: req.response,
        keyDataHex: linked.passkeyKeyDataHex,
      })
      sendResponse(ok({ ok: true }))
      return true
    }
    default:
      return false
  }
}
