import { useState } from "react"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Select,
} from "@medusajs/ui"
import { useCampaigns } from "../../hooks/api/campaigns"
import { sdk } from "../../lib/client"

/**
 * Bulk-generate single-use platform credit codes for an existing
 * campaign. Per PRD §7: each code is a fixed dollar value Medusa
 * promotion with usage_limit=1, attached to a campaign whose budget
 * caps total outstanding credit.
 *
 * Campaigns must be created first via the Campaigns admin page;
 * this screen only handles bulk code generation.
 */
export const PlatformCredits = () => {
  const { campaigns, isLoading: loadingCampaigns } = useCampaigns()

  const [campaignId, setCampaignId] = useState<string>("")
  const [count, setCount] = useState<number>(25)
  const [valueDollars, setValueDollars] = useState<string>("25.00")
  const [prefix, setPrefix] = useState<string>("CO-CREDIT")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{
    generated: number
    codes: { id: string; code: string }[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setError(null)
    setResult(null)

    const cents = Math.round(parseFloat(valueDollars) * 100)
    if (isNaN(cents) || cents < 1) {
      setError("Value must be a positive dollar amount")
      return
    }

    setGenerating(true)
    try {
      const res = await sdk.client.fetch<{
        generated: number
        codes: { id: string; code: string }[]
      }>("/admin/platform-credits/generate", {
        method: "POST",
        body: {
          campaign_id: campaignId,
          count,
          value_cents: cents,
          prefix,
        },
      })
      setResult(res)
    } catch (err: any) {
      setError(err?.message || "Failed to generate codes")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyAll = () => {
    if (!result) return
    const text = result.codes.map((c) => c.code).join("\n")
    navigator.clipboard.writeText(text)
  }

  return (
    <Container className="p-0">
      <div className="p-6 border-b">
        <Heading level="h1">Platform Credits</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          Bulk-generate single-use promotional codes tied to a campaign.
          Each code acts as a platform credit; the campaign budget caps
          total outstanding credit. Manage campaigns (and their budgets)
          on the{" "}
          <a href="/campaigns" className="underline text-ui-fg-interactive">
            Campaigns
          </a>{" "}
          page.
        </Text>
      </div>

      <div className="p-6 border-b bg-ui-bg-subtle">
        <Heading level="h2" className="mb-4">
          Generate Codes
        </Heading>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <Label htmlFor="pc-campaign">Campaign</Label>
            <Select
              value={campaignId}
              onValueChange={setCampaignId}
              disabled={loadingCampaigns}
            >
              <Select.Trigger id="pc-campaign">
                <Select.Value placeholder="Select a campaign..." />
              </Select.Trigger>
              <Select.Content>
                {(campaigns || []).map((c: any) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name} ({c.campaign_identifier})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div>
            <Label htmlFor="pc-count">Number of Codes</Label>
            <Input
              id="pc-count"
              type="number"
              min={1}
              max={500}
              value={String(count)}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            />
            <Text className="text-ui-fg-subtle text-xs mt-1">Max 500 per batch</Text>
          </div>

          <div>
            <Label htmlFor="pc-value">Value per Code (USD)</Label>
            <Input
              id="pc-value"
              type="number"
              step="0.01"
              min={0.01}
              value={valueDollars}
              onChange={(e) => setValueDollars(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="pc-prefix">Code Prefix</Label>
            <Input
              id="pc-prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="CO-CREDIT"
            />
            <Text className="text-ui-fg-subtle text-xs mt-1">
              Final codes look like <code>{prefix || "CO-CREDIT"}-AB12CD34</code>.
              Ambiguous characters (0/O/1/I) are omitted from the random part.
            </Text>
          </div>
        </div>

        {error && (
          <Text className="text-ui-fg-error text-sm mb-3">{error}</Text>
        )}

        <Button
          variant="primary"
          size="small"
          onClick={handleGenerate}
          isLoading={generating}
          disabled={!campaignId || count < 1 || !valueDollars}
        >
          Generate {count} Code{count === 1 ? "" : "s"}
        </Button>
      </div>

      {result && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Heading level="h2">
              Generated {result.generated} Code{result.generated === 1 ? "" : "s"}
            </Heading>
            <Button variant="secondary" size="small" onClick={handleCopyAll}>
              Copy All
            </Button>
          </div>
          <div className="border rounded bg-ui-bg-base max-h-96 overflow-y-auto">
            <div className="divide-y">
              {result.codes.map((c) => (
                <div key={c.id} className="px-4 py-2 font-mono text-sm">
                  {c.code}
                </div>
              ))}
            </div>
          </div>
          <Text className="text-ui-fg-subtle text-xs mt-3">
            Each code is a single-use Medusa promotion linked to the
            selected campaign. View or edit individual codes on the{" "}
            <a href="/promotions" className="underline">
              Promotions
            </a>{" "}
            page.
          </Text>
        </div>
      )}
    </Container>
  )
}
