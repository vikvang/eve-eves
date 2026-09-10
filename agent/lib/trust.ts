import type { SessionAuthContext } from "eve/context";

/**
 * Constructed principal for unattended factory runs.
 *
 * @remarks
 * Kept for the approval policies and any future autonomous intake. The game
 * factory's only integration surface is the eve chat channel, so runs today
 * are always attended: a person is on the other end of the chat, and approval
 * cards park on that chat instead of stranding a webhook turn. Real GitHub
 * actors project as numeric `github:<id>` principals, so this fixed login can
 * never collide with one.
 */
export const AUTONOMOUS_PRINCIPAL = "github:foreman-factory";

/**
 * Auth attribute marking a caller the dispatching channel decided to trust.
 *
 * @remarks
 * Trust is decided once, at dispatch. The eve chat channel intentionally does
 * not stamp this by default: chat sessions stay untrusted so reversible GitHub
 * writes and factory-brain updates park on an approval card the person can
 * answer in chat. Draft pull requests still run without a card
 * (`createPullRequestPolicy` with `draft: true`). Stamp it only when a future
 * channel proves the caller at the edge (for example a signed webhook from a
 * known maintainer).
 */
export const TRUSTED_ATTRIBUTE = "trusted";

/**
 * Returns a copy of `auth` carrying the {@link TRUSTED_ATTRIBUTE} stamp.
 *
 * @remarks
 * Channels call this at dispatch, next to the authorization decision itself,
 * so the stamp and the gate can never drift apart.
 */
export function stampTrusted(auth: SessionAuthContext): SessionAuthContext {
  return {
    ...auth,
    attributes: { ...auth.attributes, [TRUSTED_ATTRIBUTE]: "true" },
  };
}

/**
 * Auth attribute carrying the issue number an unattended run was dispatched
 * from.
 *
 * @remarks
 * Stamped by {@link stampAutonomous} at dispatch. Unused while the only intake
 * is the eve chat channel; kept so approval policies that scope autonomous
 * comments remain valid if autonomous intake returns.
 */
export const INTAKE_ISSUE_ATTRIBUTE = "intakeIssue";

/**
 * Rewrites a channel auth into the unattended factory principal, carrying the
 * intake issue number.
 */
export function stampAutonomous(
  auth: SessionAuthContext,
  intakeIssue: number
): SessionAuthContext {
  return {
    ...auth,
    attributes: {
      ...auth.attributes,
      [INTAKE_ISSUE_ATTRIBUTE]: String(intakeIssue),
    },
    principalId: AUTONOMOUS_PRINCIPAL,
    principalType: "service",
  };
}

/**
 * The issue number an unattended run was dispatched from, or null when the
 * session is not an unattended run (or predates the stamp).
 */
export function intakeIssueNumber(
  auth: SessionAuthContext | null
): number | null {
  if (!isAutonomous(auth)) {
    return null;
  }
  const stamped = auth?.attributes[INTAKE_ISSUE_ATTRIBUTE];
  if (typeof stamped !== "string" || stamped === "") {
    return null;
  }
  const issue = Number(stamped);
  return Number.isSafeInteger(issue) && issue > 0 ? issue : null;
}

/**
 * Whether the session runs unattended under {@link AUTONOMOUS_PRINCIPAL}.
 */
export function isAutonomous(auth: SessionAuthContext | null): boolean {
  return auth !== null && auth.principalId === AUTONOMOUS_PRINCIPAL;
}

/**
 * Whether the dispatching channel stamped this caller as trusted.
 *
 * @remarks
 * This is the single caller check for routine repository writes. New
 * capabilities gate on this predicate (or {@link isAutonomous} /
 * {@link isScheduleAppAuth}) rather than inventing their own.
 */
export function isTrusted(auth: SessionAuthContext | null): boolean {
  return auth !== null && auth.attributes[TRUSTED_ATTRIBUTE] === "true";
}

/**
 * The app principal eve stamps on schedule-dispatched turns.
 *
 * @remarks
 * No schedule ships in this template, but the approval policies already
 * recognize the principal so a schedule added later inherits sensible write
 * behavior: reversible writes run, anything that ships still parks for a person.
 */
export function isScheduleAppAuth(auth: SessionAuthContext | null): boolean {
  return (
    auth !== null &&
    auth.authenticator === "app" &&
    auth.principalId === "eve:app" &&
    auth.principalType === "runtime"
  );
}
