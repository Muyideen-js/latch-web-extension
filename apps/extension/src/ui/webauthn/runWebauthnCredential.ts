import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

import type { Surface } from '../routing/routes'
import { formatWebauthnBrowserError } from './passkey'
import { openPasskeyBridgeAndWait } from './passkeyBridge'

/**
 * Chrome does not reliably run WebAuthn inside the extension side panel (hangs with no UI).
 * Popup uses in-page credentials; side panel opens the shared `tabs/passkey-bridge` window.
 */
export async function runWebauthnCredential(
  surface: Surface,
  mode: 'registration' | 'authentication',
  optionsJSON: unknown
): Promise<unknown> {
  try {
    if (surface === 'sidepanel') {
      return await openPasskeyBridgeAndWait({ mode, optionsJSON })
    }
    if (mode === 'registration') {
      return await startRegistration({
        optionsJSON,
      } as unknown as Parameters<typeof startRegistration>[0])
    }
    return await startAuthentication({
      optionsJSON,
    } as unknown as Parameters<typeof startAuthentication>[0])
  } catch (e) {
    throw new Error(formatWebauthnBrowserError(e))
  }
}
