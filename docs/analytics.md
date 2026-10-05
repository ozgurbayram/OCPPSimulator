# Google Analytics 4

No Firebase backend or private API key is required. The public `G-...` measurement ID is visible in the browser even when supplied by GitHub Actions. Never supply a service account, Measurement Protocol API secret or other private credential to Vite.

## Enable on the official site

1. Create a Google Analytics property and a **Web** data stream for `https://ozgurbayram.github.io/OCPPSimulator/`.
2. **Turn off Enhanced measurement for that stream before deployment.** This prevents Google's automatic history, form, outbound-link and other collection from bypassing the app's manually sanitized events. Do not enable Google Signals, user-provided data collection or advertising integrations for this setup.
3. Copy the stream's `G-...` measurement ID.
4. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**. Add `VITE_GA_MEASUREMENT_ID` with that value. It is a public identifier, so a repository variable is sufficient.
5. Run **Actions → Deploy to GitHub Pages → Run workflow**, or push the integration to main. Changing a variable alone does not rebuild the site.
6. Open the live site and check GA4 Realtime. Analytics starts automatically. Ad blockers can prevent collection.

Without the variable, the app does not load Google Analytics. Localhost, alternate hosts and forks' normal deployments are disabled. The host/path check avoids accidental reporting; it cannot prevent someone deliberately sending forged events to a public ID.

## Collection and privacy

- Analytics starts automatically on the official site when the measurement ID is configured.
- `page_view`: dashboard, generic charge-point page, or other. Moving between individual charge points does not generate distinct page views.
- `charge_point_created`: protocol and configured connector count.
- `connection_attempted`, `connection_connected`, `connection_disconnected`, `connection_error`: protocol and, for a close, its numeric WebSocket close code.
- `ocpp_boot_notification`, `ocpp_heartbeat`, `ocpp_authorize`, `ocpp_status_notification`, `ocpp_unlock_connector`: manual action result and connector number where relevant.
- `charging_started`: protocol, connector number and starting state of charge.
- `charging_stopped`: protocol, connector number, session duration, delivered kWh, ending state of charge and stop reason.
- `fault_simulated`, `fault_cleared`: connector number plus the allowlisted OCPP fault code and category.
- GA4 records the event timestamp automatically. No custom date string is sent.
- No connection names, CP IDs, CSMS URLs, RFID tags, credentials, transaction IDs or protocol frames are collected. Page URLs and titles are fixed categories; referrers are blank. Google still receives normal browser/network metadata and uses pseudonymous analytics cookies.
- Analytics cookies use the app-specific `ocppsim` prefix, host-only domain and `/OCPPSimulator/` path, with a configured 180-day lifetime.
- The previous Vercel Analytics component is no longer mounted.

To use the parameters in standard GA4 reports, register event-scoped custom dimensions for `protocol`, `result`, `source`, `reason`, `fault_code` and `fault_category`; register custom metrics for `connector_number`, `connector_count`, `energy_kwh`, `duration_seconds`, `start_soc_percent` and `end_soc_percent`. DebugView shows the raw parameters without this setup.

## Verify before enabling

Use browser Network tools: expect one Google tag script and one page view after opening the official site. Open a charge point and verify only a generic charge-point URL is sent. Trigger Create/StartTx and inspect the corresponding event names with no user-entered data.

Remove the repository variable and redeploy to disable analytics globally. Restoring a prior release also rolls back the integration.

## Local DebugView

Create an ignored `.env.local` file with the measurement ID and `VITE_GA_DEBUG=true`, then restart the development server. Local events are sent automatically with GA4 `debug_mode` and appear in **Admin → DebugView**. Never enable `VITE_GA_DEBUG` in the GitHub Pages workflow.
