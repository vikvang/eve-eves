import { type AuthFn, localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

const localDevAuth = localDev();

/**
 * Dev-only: present a local session as an authenticated user.
 *
 * @remarks
 * The user-preference tools key their storage on a `principalType: "user"` session. In
 * production the channel supplies one via your route auth; the eve dev TUI authenticates with
 * `localDev()`, whose `local-dev` principal is not a user, so user-scoped tool calls fail with
 * `principal_required`. This shim defers the trust decision to `localDev()` — returning `null`
 * for anything it would reject, so it never affects production — and only upgrades the resolved
 * principal to a user. It does not stamp `attributes.trusted`: chat stays attended but untrusted,
 * so reversible GitHub writes and factory-brain updates park on approval cards in the TUI or
 * chat client. Draft pull requests still run without a card. Drop the shim if you don't exercise
 * user-scoped tools from the dev TUI.
 */
const localDevUser: AuthFn<Request> = async (request) => {
  const local = await localDevAuth(request);
  return local ? { ...local, principalType: "user" } : null;
};

/**
 * Default HTTP API for the game factory.
 *
 * @remarks
 * This is the only integration surface: work arrives as a chat prompt. Auth is
 * `[localDevUser, vercelOidc()]` — local TUI and Vercel-issued OIDC for internal
 * callers. Neither admits anonymous browser traffic in production. Because the
 * session is attended (a person is watching the chat), approval cards park here
 * rather than being denied the way unattended webhook runs would be. See
 * `agent/lib/trust.ts` for the stamps approval policies read.
 */
export default eveChannel({ auth: [localDevUser, vercelOidc()] });
