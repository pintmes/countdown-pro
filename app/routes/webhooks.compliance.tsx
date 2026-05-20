import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { deleteAllTimersForShop } from "../lib/timers.server";

// Handles all three mandatory GDPR compliance webhooks for public Shopify apps:
//   - customers/data_request: Merchant requested a customer's data. We don't
//     store any customer data — the only data we keep is Timer configs scoped
//     to the shop — so there is nothing to return.
//   - customers/redact:        Merchant requested a customer's data be erased.
//     Same as above — nothing to delete.
//   - shop/redact:             Issued 48h after a shop uninstalls. Delete
//     anything left over (timers + sessions) for that shop.
//
// All three must return 200 OK quickly, or Shopify will retry.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  // eslint-disable-next-line no-console
  console.log(`Received compliance webhook ${topic} for ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // No customer data is stored by this app. Acknowledge.
      break;
    case "CUSTOMERS_REDACT":
      // No customer data to delete. Acknowledge.
      break;
    case "SHOP_REDACT": {
      const shopDomain =
        shop ||
        (typeof payload === "object" && payload && "shop_domain" in payload
          ? String((payload as { shop_domain: unknown }).shop_domain)
          : "");
      if (shopDomain) {
        await deleteAllTimersForShop(shopDomain);
      }
      break;
    }
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unhandled compliance topic: ${topic}`);
  }

  return new Response();
};
