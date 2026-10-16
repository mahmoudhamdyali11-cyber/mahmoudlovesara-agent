import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Keep Vercel-native access for the Eve TUI and trusted deployments.
    vercelOidc(),
    // Local CLI / REPL access only during development.
    localDev(),
    // Browser requests are allowed only because this project is protected by Vercel SSO.
    // Do not add a custom domain or disable SSO without replacing this with app-level auth.
    none(),
  ],
});
