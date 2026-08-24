/**
 * Background Service Worker — the ONLY execution context that may hold key material.
 *
 * Responsibilities:
 * - Encrypted vault (keys never leave this context)
 * - Transaction signing
 * - Message routing from popup and content scripts
 *
 * Security rule: NEVER send raw private keys in chrome.runtime.sendMessage responses.
 */

import './cleanup-main-injector'
import './actionBehavior'

import type { BackgroundMessage, BackgroundResponse } from '@latch/types'

import { tryHandleAccountsMessage } from './accounts/handlers'
import { initDappApprovalListeners } from './dapp/approvalSession'
import { tryHandleDappMessage } from './dapp/handlers'
import { tryHandleDepositMessage } from './deposit/handlers'
import { postDebugPayload } from './debugAgentLog'
import { ok, toSerializableError } from './messageResponse'
import { tryHandleMigrationMessage } from './migration/handlers'
import { tryHandleMultisigMessage } from './multisig/handlers'
import { tryHandleNetworkMessage } from './network/handlers'
import { tryHandleOnboardingMessage } from './onboarding/handlers'
import { tryHandleReadsMessage } from './reads/handlers'
import { tryHandleSwapMessage } from './swap/handlers'
import { tryHandleTxMessage } from './tx/handlers'
import { tryHandleV1AuthMessage } from './v1Auth/handlers'

initDappApprovalListeners()

chrome.runtime.onMessage.addListener((rawMessage: BackgroundMessage, _sender, sendResponse) => {
  // #region agent log
  const maybeDebug = rawMessage as { type?: string; payload?: Record<string, unknown> }
  if (maybeDebug?.type === 'DEBUG_AGENT_LOG' && maybeDebug.payload) {
    postDebugPayload(maybeDebug.payload as Parameters<typeof postDebugPayload>[0])
    sendResponse({ ok: true })
    return true
  }
  // #endregion
  const message = rawMessage as BackgroundMessage

  ;(async () => {
    if (await tryHandleMultisigMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleV1AuthMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleDepositMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleAccountsMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleTxMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleReadsMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleSwapMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleMigrationMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleNetworkMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleDappMessage(message, sendResponse, ok)) {
      return
    }
    if (await tryHandleOnboardingMessage(message, sendResponse, ok)) {
      return
    }

    const type = message?.type ?? 'unknown'
    console.warn('[latch:background] unhandled message', type)
    sendResponse({
      ok: false,
      error: {
        message: `Unhandled background message: ${String(type)}`,
        code: 'unhandled_message',
      },
    } satisfies BackgroundResponse)
  })().catch((err) => {
    sendResponse({ ok: false, error: toSerializableError(err) } satisfies BackgroundResponse)
  })

  return true // keep channel open for async responses
})

export {}
