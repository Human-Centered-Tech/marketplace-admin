import { useMemo, useState } from "react";

import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Prompt,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";

import { useUpdateDirectoryListing } from "../../../hooks/api/directory";

/**
 * Editor for a listing's CORE fields — Matteo 2026-08-18:
 *
 *   "Edit each and every field related to any listing, even when left empty.
 *    Including slug."
 *
 * The "even when left empty" half is the bigger complaint, and it is a
 * rendering problem, not a permissions one. The detail page rendered fields
 * conditionally — `{listing.description && <Text>…</Text>}` — so a field that
 * was never populated drew literally nothing, and there was no way to put a
 * first value into it from the panel. Editing had to go through whichever
 * purpose-built section happened to cover that field, and the plain business
 * details were covered by none of them.
 *
 * The fix is to render from a SCHEMA rather than from the record. FIELDS below
 * is the source of truth for what exists; every entry always renders, empty or
 * not, so "blank" is a visible editable state instead of an absence.
 */

type FieldType = "text" | "email" | "tel" | "url" | "textarea" | "slug";

type FieldDef = {
  /** Column name on directory_listing — sent verbatim in the PUT body. */
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Shown under the input, always — these are the rules, not error text. */
  help?: string;
  required?: boolean;
};

/**
 * The listing's plain business details. Deliberately NOT everything on the
 * row — the fields below are the ones with no other home in the panel.
 *
 * Excluded on purpose, because each already has a dedicated editor and
 * duplicating them here would create two sources of truth for one column:
 *   category_ids       → CategoryEditor
 *   logo/cover         → LogoCoverEditor
 *   gallery_urls       → GalleryEditor
 *   owner_interview,
 *   devotional,
 *   cta_type/cta_url,
 *   always_open        → ExtendedFieldsEditor
 *   subscription_tier  → TierOverrideSection
 *   pricing_tier       → BusinessTypeSwitch / TierOverrideSection
 *   affiliations       → ParishAffiliations
 *   badges             → BadgeAssignment
 *   premium/serviced
 *   states             → PremiumStatesEditor / ServicedStatesEditor
 *   address            → geocoded server-side from a structured blob; a free
 *                        text box here would silently desync the map pin.
 *
 * Billing columns (stripe_*, subscription_status) are NOT editable here by
 * design: they are Stripe's state, not ours, and the panel already has the
 * deliberate, audited paths for them (link membership / comp / un-claim).
 */
const FIELDS: FieldDef[] = [
  {
    name: "business_name",
    label: "Business name",
    type: "text",
    required: true,
    placeholder: "St Jude Woodworking",
    help: "Shown everywhere in the directory and in search results.",
  },
  {
    name: "slug",
    label: "Slug",
    type: "slug",
    required: true,
    placeholder: "st-jude-woodworking",
    help: "Lowercase letters, numbers and single hyphens. Must be unique across all listings.",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "What this business does…",
    help: "Searchable. Appears on the public listing page.",
  },
  {
    name: "contact_email",
    label: "Contact email",
    type: "email",
    placeholder: "hello@example.com",
    help: "Public contact address. Also used as a fallback recipient for membership email.",
  },
  {
    name: "contact_phone",
    label: "Contact phone",
    type: "tel",
    placeholder: "(555) 123-4567",
  },
  {
    name: "website_url",
    label: "Website",
    type: "url",
    placeholder: "https://example.com",
    help: "Include https://.",
  },
];

/** Mirror of the backend's normalizeSlug, for the live preview only. */
const previewSlug = (raw: string) =>
  raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const CoreFieldsEditor = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing();

  const initial = useMemo(() => {
    const seed: Record<string, string> = {};
    for (const f of FIELDS) {
      // `?? ""` not `|| ""` — and either way the point is that a null column
      // becomes an empty, EDITABLE input rather than a missing one.
      seed[f.name] = (listing?.[f.name] ?? "") as string;
    }
    return seed;
  }, [listing]);

  const [form, setForm] = useState<Record<string, string>>(initial);
  const [confirmSlugOpen, setConfirmSlugOpen] = useState(false);

  const set = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const dirty = FIELDS.some((f) => form[f.name] !== initial[f.name]);
  const slugChanged = form.slug !== initial.slug;
  const slugPreview = previewSlug(form.slug ?? "");
  const slugWillNormalize =
    slugChanged && slugPreview !== (form.slug ?? "").trim();

  const save = async () => {
    // Client-side required check so an obvious mistake doesn't need a round
    // trip. The server enforces the same rules regardless.
    for (const f of FIELDS) {
      if (f.required && !form[f.name]?.trim()) {
        toast.error(`${f.label} can't be empty.`);
        return;
      }
    }

    const body: Record<string, unknown> = { id: listing.id };
    for (const f of FIELDS) {
      if (form[f.name] === initial[f.name]) continue;
      const value = form[f.name];
      // Send "" for a cleared optional field — the backend maps empty strings
      // on nullable text columns to NULL. That is what makes "blank it out"
      // work at all; sending nothing would just leave the old value in place.
      body[f.name] = value;
    }

    if (Object.keys(body).length === 1) {
      toast.info("Nothing changed.");
      return;
    }

    try {
      const res: any = await update.mutateAsync(body as any);
      toast.success("Listing updated.");

      // Say out loud what was actually stored when it differs from what was
      // typed, rather than silently rewriting the operator's input.
      if (res?.slug_renamed) {
        toast.info(
          `Slug saved as "${res.slug_renamed.to}"${
            res.slug_renamed.normalized ? " (normalized)" : ""
          }. Search index refreshed.`
        );
        setForm((prev) => ({ ...prev, slug: res.slug_renamed.to }));
      }
    } catch (e: any) {
      // A slug collision comes back as a 409 whose message names the listing
      // holding it. Surface it verbatim — it is the actionable part.
      toast.error(e?.message || "Could not save. Please try again.");
    }
  };

  const onSaveClick = () => {
    if (slugChanged) {
      setConfirmSlugOpen(true);
      return;
    }
    void save();
  };

  return (
    <Container className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h2">Listing details</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            Every field is editable, including ones that are currently empty.
          </Text>
        </div>
        <Button
          size="small"
          onClick={onSaveClick}
          disabled={!dirty}
          isLoading={update.isPending}
          data-testid="core-fields-save"
        >
          Save changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map((f) => {
          const isWide = f.type === "textarea";
          const value = form[f.name] ?? "";
          const wasEmpty = !initial[f.name];

          return (
            <div key={f.name} className={isWide ? "md:col-span-2" : undefined}>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor={`core-${f.name}`} size="small" weight="plus">
                  {f.label}
                  {f.required ? " *" : ""}
                </Label>
                {/* The visible marker for the thing that was impossible
                    before: a field with no value at all still renders, and
                    says so. */}
                {wasEmpty && (
                  <Text
                    size="xsmall"
                    className="text-ui-fg-muted"
                    data-testid={`core-empty-${f.name}`}
                  >
                    empty
                  </Text>
                )}
              </div>

              {isWide ? (
                <Textarea
                  id={`core-${f.name}`}
                  rows={4}
                  value={value}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <Input
                  id={`core-${f.name}`}
                  type={f.type === "slug" ? "text" : f.type}
                  value={value}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                  data-testid={`core-input-${f.name}`}
                />
              )}

              {f.help && (
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  {f.help}
                </Text>
              )}

              {f.type === "slug" && slugWillNormalize && (
                <Text size="xsmall" className="text-ui-fg-interactive mt-1">
                  Will be saved as “{slugPreview}”.
                </Text>
              )}
            </div>
          );
        })}
      </div>

      {/*
        Slug confirmation.

        What this dialog does NOT claim: it does not warn about broken links,
        because there are none to break. `directory_listing.slug` appears in no
        URL in the product — every directory link, the sitemap, and the public
        detail API are all keyed on the listing id (verified 2026-09-07; see
        the evidence trail in the backend's lib/listing-slug.ts). Writing a
        scary-but-false "existing links will break" warning here would train
        Matteo to click through warnings, which is worse than no warning.

        What it DOES do is make a rename deliberate rather than incidental, and
        state the two things that are actually true: the search index follows
        the rename automatically, and the slug has to be unique.
      */}
      <Prompt open={confirmSlugOpen} onOpenChange={setConfirmSlugOpen}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Change this listing's slug?</Prompt.Title>
            <Prompt.Description>
              <span className="block mb-2">
                “{initial.slug}” → “{slugPreview || form.slug}”
              </span>
              <span className="block mb-2">
                Directory pages and the sitemap link to this business by its
                internal ID, not its slug, so no public link changes and nothing
                404s. The search index is refreshed automatically as part of the
                save.
              </span>
              <span className="block">
                Slugs are unique. If another listing already holds this one, the
                save is rejected and we'll tell you which listing has it.
              </span>
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>Cancel</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                setConfirmSlugOpen(false);
                void save();
              }}
            >
              Change slug
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  );
};
