import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, redirect, useActionData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  createTimer,
  parseFormToTimerInput,
  validateTimerInput,
} from "../lib/timers.server";
import { TimerForm } from "../components/TimerForm";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const input = parseFormToTimerInput(formData);
  const errors = validateTimerInput(input);

  if (errors.length > 0) {
    return { errors, values: serializeForForm(input) };
  }

  await createTimer(session.shop, input);
  return redirect("/app");
};

function serializeForForm(input: ReturnType<typeof parseFormToTimerInput>) {
  return {
    ...input,
    endsAt: input.endsAt ? toLocalInputValue(input.endsAt) : "",
    targetIds: input.targetIds.join(","),
  };
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewTimer() {
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Create timer">
      <Link to="/app" slot="breadcrumbActions">
        <s-link>Back to timers</s-link>
      </Link>
      <TimerForm errors={actionData?.errors ?? []} values={actionData?.values} />
    </s-page>
  );
}
