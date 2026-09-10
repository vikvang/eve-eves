import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";
import {
  FACTORY_SANDBOX_CREATE_OPTIONS,
  factoryBootstrap,
  factoryOnSession,
  factoryRevalidationKey,
} from "../../lib/github/repo-sandbox.js";

/**
 * Player sandbox: an independent checkout of the factory repository.
 *
 * @remarks
 * Declared subagents share nothing with the root or each other, so the player
 * gets its own checkout from the shared builders in
 * `agent/lib/github/repo-sandbox.ts` and fetches the branch under test with
 * `checkout_branch`. Playtesting in a separate sandbox from the implementer is
 * deliberate: the player sees the pushed branch, not the implementer's working state.
 */
export default defineSandbox({
  backend: vercel(FACTORY_SANDBOX_CREATE_OPTIONS),
  bootstrap: factoryBootstrap,
  onSession: factoryOnSession,
  revalidationKey: factoryRevalidationKey,
});
