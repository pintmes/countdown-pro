import { useMemo, useState } from "react";
import { Form, useNavigation } from "react-router";
import type { TimerValidationError } from "../lib/timers.server";

interface FormValues {
  name: string;
  type: string;
  endsAt: string;
  durationSeconds: number | null;
  placement: string;
  targetType: string;
  targetIds: string;
  headline: string;
  subtext: string;
  endedText: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showDays: boolean;
  hideWhenEnded: boolean;
  active: boolean;
}

const DEFAULTS: FormValues = {
  name: "",
  type: "flash_sale",
  endsAt: "",
  durationSeconds: 3600,
  placement: "announcement_bar",
  targetType: "all",
  targetIds: "",
  headline: "Hurry! Sale ends in",
  subtext: "Don't miss out on this deal",
  endedText: "This offer has ended",
  backgroundColor: "#111827",
  textColor: "#FFFFFF",
  accentColor: "#F59E0B",
  showDays: true,
  hideWhenEnded: false,
  active: true,
};

export function TimerForm({
  errors,
  values,
}: {
  errors: TimerValidationError[];
  values?: Partial<FormValues>;
}) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const initial: FormValues = useMemo(
    () => ({ ...DEFAULTS, ...values }),
    [values],
  );
  const [type, setType] = useState<string>(initial.type);
  const [targetType, setTargetType] = useState<string>(initial.targetType);

  const errorsByField = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of errors) map[e.field] = e.message;
    return map;
  }, [errors]);

  return (
    <Form method="post">
      <s-stack direction="block" gap="large">
        <s-section heading="Basics">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="name"
              label="Name (internal)"
              value={initial.name}
              required
              {...(errorsByField.name ? { error: errorsByField.name } : {})}
            />

            <label>
              <s-text>Timer type</s-text>
              <select
                name="type"
                defaultValue={initial.type}
                onChange={(e) =>
                  setType((e.target as HTMLSelectElement).value)
                }
              >
                <option value="flash_sale">
                  Flash sale — fixed end date
                </option>
                <option value="evergreen">
                  Evergreen — per-visitor countdown
                </option>
                <option value="daily">Daily reset — resets every day</option>
              </select>
            </label>

            {type === "flash_sale" ? (
              <label>
                <s-text>Ends at</s-text>
                <input
                  type="datetime-local"
                  name="endsAt"
                  defaultValue={initial.endsAt}
                  required
                />
                {errorsByField.endsAt ? (
                  <s-text tone="critical">{errorsByField.endsAt}</s-text>
                ) : null}
              </label>
            ) : (
              <label>
                <s-text>Duration (seconds)</s-text>
                <input
                  type="number"
                  name="durationSeconds"
                  min={60}
                  max={60 * 60 * 24 * 30}
                  defaultValue={initial.durationSeconds ?? 3600}
                />
                {errorsByField.durationSeconds ? (
                  <s-text tone="critical">{errorsByField.durationSeconds}</s-text>
                ) : null}
              </label>
            )}
          </s-stack>
        </s-section>

        <s-section heading="Placement & targeting">
          <s-stack direction="block" gap="base">
            <label>
              <s-text>Placement</s-text>
              <select name="placement" defaultValue={initial.placement}>
                <option value="announcement_bar">
                  Announcement bar (sitewide)
                </option>
                <option value="product">Product page</option>
                <option value="cart">Cart</option>
              </select>
            </label>

            <label>
              <s-text>Show on</s-text>
              <select
                name="targetType"
                defaultValue={initial.targetType}
                onChange={(e) =>
                  setTargetType((e.target as HTMLSelectElement).value)
                }
              >
                <option value="all">All pages</option>
                <option value="product">Specific products</option>
                <option value="collection">Specific collections</option>
              </select>
            </label>

            {targetType !== "all" && (
              <s-text-field
                name="targetIds"
                label={
                  targetType === "product"
                    ? "Product IDs (comma-separated, e.g. gid://shopify/Product/123,gid://shopify/Product/456)"
                    : "Collection IDs (comma-separated)"
                }
                value={initial.targetIds}
                {...(errorsByField.targetIds
                  ? { error: errorsByField.targetIds }
                  : {})}
              />
            )}
          </s-stack>
        </s-section>

        <s-section heading="Copy">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="headline"
              label="Headline"
              value={initial.headline}
              {...(errorsByField.headline
                ? { error: errorsByField.headline }
                : {})}
            />
            <s-text-field
              name="subtext"
              label="Subtext"
              value={initial.subtext}
              {...(errorsByField.subtext
                ? { error: errorsByField.subtext }
                : {})}
            />
            <s-text-field
              name="endedText"
              label="Text shown when expired"
              value={initial.endedText}
              {...(errorsByField.endedText
                ? { error: errorsByField.endedText }
                : {})}
            />
          </s-stack>
        </s-section>

        <s-section heading="Style">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="backgroundColor"
              label="Background color (hex)"
              value={initial.backgroundColor}
              {...(errorsByField.backgroundColor
                ? { error: errorsByField.backgroundColor }
                : {})}
            />
            <s-text-field
              name="textColor"
              label="Text color (hex)"
              value={initial.textColor}
              {...(errorsByField.textColor
                ? { error: errorsByField.textColor }
                : {})}
            />
            <s-text-field
              name="accentColor"
              label="Accent color (hex)"
              value={initial.accentColor}
              {...(errorsByField.accentColor
                ? { error: errorsByField.accentColor }
                : {})}
            />

            <label>
              <input
                type="checkbox"
                name="showDays"
                defaultChecked={initial.showDays}
              />{" "}
              <s-text>Show days segment</s-text>
            </label>
            <label>
              <input
                type="checkbox"
                name="hideWhenEnded"
                defaultChecked={initial.hideWhenEnded}
              />{" "}
              <s-text>Hide timer after it ends</s-text>
            </label>
            <label>
              <input
                type="checkbox"
                name="active"
                defaultChecked={initial.active}
              />{" "}
              <s-text>Active</s-text>
            </label>
          </s-stack>
        </s-section>

        <s-stack direction="inline" gap="base">
          <s-button
            type="submit"
            variant="primary"
            {...(submitting ? { loading: true } : {})}
          >
            Save timer
          </s-button>
          <s-button href="/app" variant="tertiary">
            Cancel
          </s-button>
        </s-stack>
      </s-stack>
    </Form>
  );
}
