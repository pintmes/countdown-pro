import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Countdown Pro</h1>
        <p className={styles.text}>
          Boost conversions with beautiful countdown timers — flash sales,
          evergreen urgency, and daily resets — that drop into any Shopify theme
          with one click.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Three timer modes</strong>. Flash sale, evergreen, and
            daily-reset — pick the urgency that fits your store.
          </li>
          <li>
            <strong>One-click theme install</strong>. App blocks for product
            pages and app embeds for site-wide announcement bars. No code.
          </li>
          <li>
            <strong>Pixel-perfect customization</strong>. Headline, subtext,
            colors, days/hours/minutes/seconds segments — fully tunable.
          </li>
        </ul>
      </div>
    </div>
  );
}
