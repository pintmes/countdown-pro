import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import {
  deleteTimer,
  listTimersForShop,
  toggleTimer,
} from "../lib/timers.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const timers = await listTimersForShop(session.shop);
  return { timers };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, error: "Missing timer id" };
  }

  if (intent === "toggle") {
    const nextActive = formData.get("active") === "true";
    await toggleTimer(session.shop, id, nextActive);
    return redirect("/app");
  }

  if (intent === "delete") {
    await deleteTimer(session.shop, id);
    return redirect("/app");
  }

  return { ok: false, error: "Unknown intent" };
};

function formatType(type: string): string {
  switch (type) {
    case "flash_sale":
      return "Flash sale";
    case "evergreen":
      return "Evergreen";
    case "daily":
      return "Daily reset";
    default:
      return type;
  }
}

function formatPlacement(placement: string): string {
  switch (placement) {
    case "announcement_bar":
      return "Announcement bar";
    case "product":
      return "Product page";
    case "cart":
      return "Cart";
    default:
      return placement;
  }
}

export default function TimersIndex() {
  const { timers } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <s-page heading="Countdown Pro">
      <s-button slot="primary-action" href="/app/timers/new" variant="primary">
        Create timer
      </s-button>

      <s-section heading="Your countdown timers">
        {timers.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              You haven&apos;t created any timers yet. Countdown timers create urgency
              and have been shown to increase conversion rates on product pages.
            </s-paragraph>
            <s-stack direction="inline" gap="base">
              <s-button href="/app/timers/new" variant="primary">
                Create your first timer
              </s-button>
            </s-stack>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="base">
            {timers.map((timer) => (
              <s-box
                key={timer.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <s-stack direction="block" gap="small-200">
                  <s-stack direction="inline" gap="base">
                    <s-heading>{timer.name}</s-heading>
                    <s-badge tone={timer.active ? "success" : "neutral"}>
                      {timer.active ? "Active" : "Paused"}
                    </s-badge>
                    <s-badge>{formatType(timer.type)}</s-badge>
                    <s-badge>{formatPlacement(timer.placement)}</s-badge>
                  </s-stack>

                  <s-paragraph>
                    {timer.type === "flash_sale" && timer.endsAt
                      ? `Ends ${new Date(timer.endsAt).toLocaleString()}`
                      : null}
                    {timer.type === "evergreen" && timer.durationSeconds
                      ? `Per-visitor duration: ${Math.round(timer.durationSeconds / 60)} minutes`
                      : null}
                    {timer.type === "daily" && timer.durationSeconds
                      ? `Daily duration: ${Math.round(timer.durationSeconds / 60)} minutes`
                      : null}
                  </s-paragraph>

                  <s-stack direction="inline" gap="small-200">
                    <Link to={`/app/timers/${timer.id}`}>
                      <s-button>Edit</s-button>
                    </Link>
                    <Form method="post" replace>
                      <input type="hidden" name="intent" value="toggle" />
                      <input type="hidden" name="id" value={timer.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={timer.active ? "false" : "true"}
                      />
                      <s-button
                        type="submit"
                        {...(busy ? { loading: true } : {})}
                      >
                        {timer.active ? "Pause" : "Resume"}
                      </s-button>
                    </Form>
                    <Form
                      method="post"
                      replace
                      onSubmit={(event) => {
                        // eslint-disable-next-line no-undef, no-alert
                        if (!confirm(`Delete timer "${timer.name}"?`)) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={timer.id} />
                      <s-button type="submit" tone="critical">
                        Delete
                      </s-button>
                    </Form>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Get started">
        <s-paragraph>
          1. Create a timer above.
        </s-paragraph>
        <s-paragraph>
          2. In your Shopify admin, open <strong>Online Store → Themes →
          Customize</strong>, then add the <strong>Countdown</strong> app block
          to any product page, or enable the <strong>Countdown bar</strong> app
          embed to show a site-wide countdown.
        </s-paragraph>
        <s-paragraph>
          3. Done — your storefront will now display the live timer.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
