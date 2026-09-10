// One place to change every agent's model. Ids are Vercel AI Gateway strings (<provider>/<model>),
// so routing, credentials, and fallbacks stay on the gateway and no provider SDK is wired in.
// Each agent.ts reads its entry here (model: MODELS.<agent>) instead of hardcoding a string.
export const MODELS = {
  implementer: "anthropic/claude-fable-5", // strongest coding model; different vendor than player
  orchestrator: "openai/gpt-5.6-terra-fast",
  player: "openai/gpt-5.6-terra-fast", // independent playtest verdict; keep on a different vendor than implementer
} as const;

export type FactoryAgent = keyof typeof MODELS;
