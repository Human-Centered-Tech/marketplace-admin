import { useState } from "react";

import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";

import { useUpdateDirectoryListing } from "../../../hooks/api/directory";
import { sdk } from "../../../lib/client";

// Same set the logo/cover + gallery editors accept (see logo-cover-editor.tsx).
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
];

const normalize = (u?: string | null) =>
  u && u.startsWith("//") ? `https:${u}` : u || "";

/**
 * Admin-side editor for the 4/1 directory fields:
 *   - always_open
 *   - owner_interview (photo + 4 Q&A)
 *   - devotional (image + question + reflection)
 *   - cta_type + cta_url
 *
 * Vendors self-edit these from the storefront; admins need to edit too
 * during verification (fix copy, remove problematic content, fill in
 * founding-pillars partnerships).
 */
export const ExtendedFieldsEditor = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing();

  const interview = listing.owner_interview || {};
  const devotional = listing.devotional || {};

  const [form, setForm] = useState({
    always_open: Boolean(listing.always_open),
    owner_photo_url: interview.photo_url || "",
    owner_q1_prompt:
      interview.q1_prompt || "What inspired you to start this business?",
    owner_q1_answer: interview.q1_answer || "",
    owner_q2_prompt:
      interview.q2_prompt || "How does your faith shape your work?",
    owner_q2_answer: interview.q2_answer || "",
    owner_q3_prompt:
      interview.q3_prompt || "What's a favorite patron saint or scripture?",
    owner_q3_answer: interview.q3_answer || "",
    owner_q4_prompt:
      interview.q4_prompt || "What's one thing you'd like customers to know?",
    owner_q4_answer: interview.q4_answer || "",
    devotional_image_url: devotional.image_url || "",
    devotional_question: devotional.question || "",
    devotional_answer: devotional.answer || "",
    cta_type: listing.cta_type || "visit_shop",
    cta_url: listing.cta_url || "",
  });

  const [savedBanner, setSavedBanner] = useState(false);
  const [uploadingOwnerPhoto, setUploadingOwnerPhoto] = useState(false);

  /**
   * Upload an owner photo file and drop the resulting URL into the existing
   * owner_photo_url form value — the save path below is untouched. Mirrors
   * logo-cover-editor.tsx: sdk.admin.upload.create → /admin/uploads.
   */
  const uploadOwnerPhoto = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error(`Unsupported format: ${file.type || file.name}`);
      return;
    }
    setUploadingOwnerPhoto(true);
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] });
      const url = (files ?? [])[0]?.url;
      if (!url) throw new Error("Upload returned no URL");
      setForm((prev) => ({ ...prev, owner_photo_url: url }));
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploadingOwnerPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      const hasInterview =
        form.owner_q1_answer ||
        form.owner_q2_answer ||
        form.owner_q3_answer ||
        form.owner_q4_answer ||
        form.owner_photo_url;
      const hasDevotional =
        form.devotional_question || form.devotional_image_url;

      await update.mutateAsync({
        id: listing.id,
        always_open: form.always_open,
        owner_interview: hasInterview
          ? {
              photo_url: form.owner_photo_url || undefined,
              q1_prompt: form.owner_q1_prompt,
              q1_answer: form.owner_q1_answer,
              q2_prompt: form.owner_q2_prompt,
              q2_answer: form.owner_q2_answer,
              q3_prompt: form.owner_q3_prompt,
              q3_answer: form.owner_q3_answer,
              q4_prompt: form.owner_q4_prompt,
              q4_answer: form.owner_q4_answer,
            }
          : null,
        devotional: hasDevotional
          ? {
              image_url: form.devotional_image_url || undefined,
              question: form.devotional_question || undefined,
              answer: form.devotional_answer || undefined,
            }
          : null,
        cta_type: form.cta_type,
        cta_url: form.cta_type === "visit_shop" ? null : form.cta_url || null,
      });

      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch (e: any) {
      // Same swallow this codebase keeps rediscovering: an awaited mutation
      // with no catch means a failed PUT just stops the spinner, shows no
      // banner and says nothing — indistinguishable from "I clicked and
      // nothing happened". Fixed for category save (33e19be) and category
      // delete (1793e68); the owner-interview save never got the same
      // treatment, and it's the one carrying the answers Brooke collects by
      // hand. Surface the backend's own message.
      toast.error(
        e?.message || "Couldn't save the extended profile. Please try again.",
      );
    }
  };

  return (
    <Container>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Heading level="h2">Extended Profile</Heading>
          <Text className="text-sm text-ui-fg-subtle">
            Owner interview, devotional, CTA, and hours flag
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={handleSave}
          disabled={uploadingOwnerPhoto}
          isLoading={update.isPending}
        >
          Save changes
        </Button>
      </div>

      {savedBanner && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          Saved.
        </div>
      )}

      {/* Always open */}
      <div className="mb-6 flex items-center gap-3 rounded border p-3">
        <Switch
          id="always-open"
          checked={form.always_open}
          onCheckedChange={(v: boolean) => setForm({ ...form, always_open: v })}
        />
        <Label htmlFor="always-open" className="mb-0">
          Always open (skip hours of operation)
        </Label>
      </div>

      {/* CTA */}
      <div className="mb-6 border-t pt-4">
        <Text weight="plus" className="mb-2">
          Call-to-Action
        </Text>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Button Type</Label>
            <Select
              value={form.cta_type}
              onValueChange={(v) => setForm({ ...form, cta_type: v })}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="visit_shop">Visit Shop (auto)</Select.Item>
                <Select.Item value="book_now">Book Now</Select.Item>
                <Select.Item value="shop_now">Shop Now</Select.Item>
                <Select.Item value="learn_more">Learn More</Select.Item>
                <Select.Item value="book_a_call">Book a Call</Select.Item>
              </Select.Content>
            </Select>
          </div>
          {form.cta_type !== "visit_shop" && (
            <div>
              <Label>Button URL</Label>
              <Input
                type="url"
                value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                placeholder="https://"
              />
            </div>
          )}
        </div>
      </div>

      {/* Owner interview */}
      <div className="mb-6 border-t pt-4">
        <Text weight="plus" className="mb-2">
          Owner Interview
        </Text>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Owner Photo</Label>
            <div className="mt-1 flex items-start gap-3">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded border bg-ui-bg-subtle">
                {form.owner_photo_url ? (
                  <>
                    <img
                      src={normalize(form.owner_photo_url)}
                      alt="Owner"
                      className="h-full w-full bg-white object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, owner_photo_url: "" }))
                      }
                      aria-label="Remove owner photo"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white hover:bg-black/80"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Text className="text-xs text-ui-fg-muted">No photo</Text>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  value={form.owner_photo_url}
                  onChange={(e) =>
                    setForm({ ...form, owner_photo_url: e.target.value })
                  }
                  placeholder="https://"
                  disabled={uploadingOwnerPhoto}
                />
                <label className="mt-2 inline-block cursor-pointer">
                  <span className="text-sm text-ui-fg-interactive hover:underline">
                    {uploadingOwnerPhoto
                      ? "Uploading…"
                      : form.owner_photo_url
                        ? "Replace with a file"
                        : "Upload a file"}
                  </span>
                  <input
                    type="file"
                    accept={SUPPORTED_FORMATS.join(",")}
                    className="hidden"
                    disabled={uploadingOwnerPhoto}
                    onChange={(e) => {
                      uploadOwnerPhoto(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                <Text className="mt-1 text-xs text-ui-fg-muted">
                  Paste a URL or upload a file. Remember to save changes.
                </Text>
              </div>
            </div>
          </div>
          {([1, 2, 3, 4] as const).map((n) => (
            <div key={n} className="space-y-2 rounded border p-3">
              <div>
                <Label>Question {n}</Label>
                <Input
                  value={(form as any)[`owner_q${n}_prompt`]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [`owner_q${n}_prompt`]: e.target.value,
                    } as any)
                  }
                />
              </div>
              <div>
                <Label>Answer {n}</Label>
                <Textarea
                  rows={2}
                  value={(form as any)[`owner_q${n}_answer`]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [`owner_q${n}_answer`]: e.target.value,
                    } as any)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Devotional */}
      <div className="border-t pt-4">
        <Text weight="plus" className="mb-2">
          Devotional
        </Text>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Image URL</Label>
            <Input
              value={form.devotional_image_url}
              onChange={(e) =>
                setForm({ ...form, devotional_image_url: e.target.value })
              }
              placeholder="https://"
            />
          </div>
          <div>
            <Label>Question / Prompt</Label>
            <Input
              value={form.devotional_question}
              onChange={(e) =>
                setForm({ ...form, devotional_question: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Reflection</Label>
            <Textarea
              rows={3}
              value={form.devotional_answer}
              onChange={(e) =>
                setForm({ ...form, devotional_answer: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </Container>
  );
};
