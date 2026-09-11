import { type AuthFn, localDev, none, vercelOidc } from "eve/channels/auth";
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
 * Vercel OIDC and local TUI sessions resolve before the final `none()` fallback,
 * which admits public browser traffic as an anonymous principal. No branch adds
 * the `trusted` stamp, so browser sessions remain attended and untrusted. Approval
 * cards continue to park before reversible writes.
 */
export default eveChannel({ auth: [vercelOidc(), localDevUser, none()] });
