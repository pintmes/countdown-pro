import type { LoaderFunctionArgs } from "react-router";
import {
  listActiveTimersForShop,
  serializeTimerForStorefront,
} from "../lib/timers.server";

// Public read-only API consumed by the theme app extension's JS bundle.
// Theme app extensions render on the storefront under the merchant's domain,
// so this endpoint must be reachable without an admin session. We scope the
// response strictly to the requested shop and only return active timers.
//
// Hardening notes:
//   - Only accepts requests with a valid `?shop=<myshop>.myshopify.com`.
//   - CORS allows any origin since the theme runs on the merchant's own
//     storefront domain (and any subdomain). The response contains no
//     sensitive data — only public-facing timer config the merchant has
//     already chosen to display.
//   - 5-minute cache so we don't get hammered on every page view.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid `shop` parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const timers = await listActiveTimersForShop(shop);
  const body = JSON.stringify({
    shop,
    timers: timers.map(serializeTimerForStorefront),
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
};
