import { defineAgent } from "eve";

export default defineAgent({
  // Use Vercel AI Gateway with the deployment OIDC identity; no provider key in source.
  model: "openai/gpt-6-astra",
});
