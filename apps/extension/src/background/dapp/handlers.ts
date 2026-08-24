import type {
  BackgroundMessage,
  DappOpenSignRequestPayload,
  ExternalSignResult,
  GetDappPermissionsRequest,
  ListPendingDappRequestsResponse,
  ResolvePendingDappRequest,
  RunExternalSignFlowRequest,
  SetDappPermissionsRequest,
} from '@latch/types'

import { BackendError } from '../api/client'
import { debugAgentLog } from '../debugAgentLog'
import { buildSignRequestSearchParams } from '../externalSign/parseSignRequest'
import { runExternalSignFlow } from '../externalSign/orchestrator'
import type { OkFn } from '../messageResponse'
import {
  addPendingDappRequest,
  getAccounts,
  getDappPermissions,
  listPendingDappRequests,
  removePendingDappRequest,
  setDappPermissions,
} from '../storage'
import {
  mapExternalSignResultToProviderResponse,
  mergePermissions,
  openApprovalPopup,
  pendingDappResolvers,
  requireDappApproval,
  waitForExternalSignDecision,
} from './approvalSession'

/** Returns true if the message type was handled. */
export async function tryHandleDappMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'GET_DAPP_PERMISSIONS': {
      const req = message.payload as GetDappPermissionsRequest
      const allowed = await getDappPermissions(req.origin)
      sendResponse(ok({ origin: req.origin, allowed }))
      return true
    }

    case 'SET_DAPP_PERMISSIONS': {
      const req = message.payload as SetDappPermissionsRequest
      const allowed = await setDappPermissions(req.origin, req.allowed)
      sendResponse(ok({ origin: req.origin, allowed }))
      return true
    }

    case 'LIST_PENDING_DAPP_REQUESTS': {
      const stored = await listPendingDappRequests()
      // Drop orphans left after SW restart (in-memory waiters are gone).
      const requests = stored.filter((r) => pendingDappResolvers.has(r.id))
      if (requests.length !== stored.length) {
        const liveIds = new Set(requests.map((r) => r.id))
        for (const orphan of stored) {
          if (!liveIds.has(orphan.id)) await removePendingDappRequest(orphan.id)
        }
      }
      const data: ListPendingDappRequestsResponse = { requests }
      sendResponse(ok(data))
      return true
    }

    case 'RESOLVE_PENDING_DAPP_REQUEST': {
      const req = message.payload as ResolvePendingDappRequest
      const resolver = pendingDappResolvers.get(req.requestId)
      pendingDappResolvers.delete(req.requestId)
      await removePendingDappRequest(req.requestId)
      resolver?.({
        approved: req.approved,
        errorMessage: req.errorMessage,
        errorCode: req.errorCode,
        signedXdr: req.signedXdr,
        txHash: req.txHash,
        signedAuthEntry: req.signedAuthEntry,
        signedTxXdr: req.signedTxXdr,
      })
      sendResponse(ok())
      return true
    }

    case 'PREPARE_EXTERNAL_SIGN': {
      const req = message.payload as RunExternalSignFlowRequest
      const result = await runExternalSignFlow({
        source: 'sign-request-tab',
        request: req.request,
        senderUrl: undefined,
        waitForDecision: waitForExternalSignDecision,
        enqueueReview: async (pending) => {
          await addPendingDappRequest(pending)
        },
      })
      sendResponse(ok(result))
      return true
    }

    case 'RUN_EXTERNAL_SIGN_FLOW': {
      const req = message.payload as RunExternalSignFlowRequest
      if (req.source === 'sign-request-tab') {
        const result = await runExternalSignFlow({
          source: 'sign-request-tab',
          request: req.request,
          waitForDecision: waitForExternalSignDecision,
          enqueueReview: async (pending) => {
            await addPendingDappRequest(pending)
          },
        })
        sendResponse(ok(result))
        return true
      }

      const result = await runExternalSignFlow({
        source: 'provider',
        request: req.request,
        senderUrl: undefined,
        waitForDecision: waitForExternalSignDecision,
        enqueueReview: async (pending) => {
          await addPendingDappRequest(pending)
        },
        openPopup: async () => {
          await openApprovalPopup()
        },
      })
      sendResponse(ok(result as ExternalSignResult))
      return true
    }

    case 'DAPP_GET_PUBLIC_KEY': {
      const req = message.payload as GetDappPermissionsRequest
      const allowed = await getDappPermissions(req.origin)
      if (!allowed.includes('getPublicKey')) {
        const approval = await requireDappApproval({ origin: req.origin, kind: 'getPublicKey' })
        if (!approval.approved)
          throw new BackendError('User rejected', { status: 403, code: 'user_rejected' })
        await setDappPermissions(req.origin, mergePermissions(allowed, 'getPublicKey'))
      }
      const { accounts, activeAccountId } = await getAccounts()
      const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
      if (!active?.smartAccountAddress) {
        throw new BackendError('No active account', { status: 400, code: 'no_account' })
      }
      sendResponse(ok({ publicKey: active.smartAccountAddress }))
      return true
    }

    case 'DAPP_OPEN_SIGN_REQUEST': {
      const req = message.payload as DappOpenSignRequestPayload
      const allowed = await getDappPermissions(req.origin)
      if (!allowed.includes('getPublicKey')) {
        const approval = await requireDappApproval({ origin: req.origin, kind: 'getPublicKey' })
        if (!approval.approved)
          throw new BackendError('User rejected', { status: 403, code: 'user_rejected' })
        await setDappPermissions(req.origin, mergePermissions(allowed, 'getPublicKey'))
      }
      const query = buildSignRequestSearchParams(req.request)
      const url = chrome.runtime.getURL(`tabs/sign-request.html?${query}`)
      await chrome.tabs.create({ url })
      sendResponse(ok())
      return true
    }

    case 'DAPP_SIGN_TRANSACTION': {
      const req = message.payload as {
        origin?: string
        request: {
          xdr: string
          network: 'testnet' | 'mainnet'
          accountToSign: string
          submit?: boolean
        }
      }
      const origin = req.origin ?? 'unknown'
      const allowed = await getDappPermissions(origin)
      if (!allowed.includes('getPublicKey')) {
        throw new BackendError('Site not connected — call getPublicKey first', {
          status: 403,
          code: 'not_connected',
        })
      }

      // #region agent log
      {
        const { accounts, activeAccountId } = await getAccounts()
        const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
        debugAgentLog({
          hypothesisId: 'H3',
          location: 'background/index.ts:DAPP_SIGN_TRANSACTION',
          message: 'dapp sign request vs active account',
          data: {
            origin,
            accountToSignSuffix: (req.request.accountToSign ?? '').slice(-8),
            activeSmartSuffix: (active?.smartAccountAddress ?? '').slice(-8),
            accountsMatch: req.request.accountToSign === active?.smartAccountAddress,
            activeMode: active?.mode ?? null,
            passkeyCredSuffix: (active?.passkeyCredentialId ?? '').slice(-12),
            hasPasskeyCred: Boolean(active?.passkeyCredentialId?.trim()),
            submit: req.request.submit,
          },
        })
      }
      // #endregion

      const flowResult = await runExternalSignFlow({
        source: 'provider',
        request: {
          network: req.request.network,
          smartAccountAddress: req.request.accountToSign,
          unsignedTxXdr: req.request.xdr,
          origin,
          submit: req.request.submit !== false,
        },
        senderUrl: undefined,
        waitForDecision: waitForExternalSignDecision,
        enqueueReview: async (pending) => {
          await addPendingDappRequest(pending)
        },
        openPopup: async () => {
          await openApprovalPopup()
        },
      })

      const response = mapExternalSignResultToProviderResponse(flowResult as ExternalSignResult)
      sendResponse(ok({ response }))
      return true
    }

    default:
      return false
  }
}
