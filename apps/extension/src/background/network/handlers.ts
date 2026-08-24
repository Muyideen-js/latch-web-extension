import type { BackgroundMessage } from '@latch/types'

import { broadcastActiveAccountChanged, broadcastNetworkChanged } from '../dappProviderEvents'
import type { OkFn } from '../messageResponse'
import { getNetworkConfig, networkLabelFor, setActiveNetwork } from './config'
import { clearNetworkScopedMemoryCaches } from './clearCaches'

/** Returns true if the message type was handled. */
export async function tryHandleNetworkMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'PING_EXTENSION': {
      sendResponse(ok({ connected: true as const }))
      return true
    }

    case 'GET_ACTIVE_NETWORK': {
      const cfg = await getNetworkConfig()
      sendResponse(ok({ network: cfg.network, networkLabel: cfg.networkLabel }))
      return true
    }

    case 'SET_ACTIVE_NETWORK': {
      const req = message.payload as { network: 'testnet' | 'mainnet' }
      const network = await setActiveNetwork(req.network)
      clearNetworkScopedMemoryCaches()
      await broadcastNetworkChanged(network)
      await broadcastActiveAccountChanged()
      sendResponse(ok({ network, networkLabel: networkLabelFor(network) }))
      return true
    }

    default:
      return false
  }
}
