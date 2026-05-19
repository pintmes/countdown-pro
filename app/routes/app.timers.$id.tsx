import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Link,
  data,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import {
  getTimer,
  parseFormToTimerInput,
  updateTimer,
  validateTimerInput,
} from "../lib/timers.server";
import { TimerForm } from "../components/TimerForm";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const id = params.id;
  if (!id) {
    throw data({ message: "Missing id" }, { status: 400 });
  }
  const timer = await getTimer(session.shop, id);
  if (!timer) {
    throw data({ message: "Timer not found" }, { status: 404 });
  }
  let targetIds: string[] = [];
  try {
    const parsed = JSON.parse(timer.targetIds);
    if (Array.isArray(parsed)) targetIds = parsed.map((v) => String(v));
  } catch {
    targetIds = [];
  }
  return {
    timer: {
      ...timer,
      endsAt: timer.endsAt ? timer.endsAt.toISOString() : null,
      targetIds,
    },
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const id = params.id;
  if (!id) {
    throw data({ message: "Missing id" }, { status: 400 });
  }
  const formData = await request.formData();
  const input = parseFormToTimerInput(formData);
  const errors = validateTimerInput(input);

  if (errors.length > 0) {
    return {
      errors,
      values: {
        ...input,
        endsAt: input.endsAt ? toLocalInputValue(input.endsAt) : "",
        targetIds: input.targetIds.join(","),
      },
    };
  }

  await updateTimer(session.shop, id, input);
  return redirect("/app");
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditTimer() {
  const { timer } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const initialValues =
    actionData?.values ??
    ({
      name: timer.name,
      type: timer.type,
      endsAt: timer.endsAt
        ? toLocalInputValue(new Date(timer.endsAt))
        : "",
      durationSeconds: timer.durationSeconds ?? null,
      placement: timer.placement,
      targetType: timer.targetType,
      targetIds: timer.targetIds.join(","),
      headline: timer.headline,
      subtext: timer.subtext,
      endedText: timer.endedText,
      backgroundColor: timer.backgroundColor,
      textColor: timer.textColor,
      accentColor: timer.accentColor,
      showDays: timer.showDays,
      hideWhenEnded: timer.hideWhenEnded,
      active: timer.active,
    } as const);

  return (
    <s-page heading={`Edit ${timer.name}`}>
      <Link to="/app" slot="breadcrumbActions">
        <s-link>Back to timers</s-link>
      </Link>
      <TimerForm errors={actionData?.errors ?? []} values={initialValues} />
    </s-page>
  );
}
