import { useState } from "react"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
} from "@medusajs/ui"
import {
  useDirectoryParishes,
  useCreateDirectoryParish,
  useUpdateDirectoryParish,
  useDeleteDirectoryParish,
} from "../../../hooks/api/directory"

type ParishForm = {
  name: string
  city: string
  state: string
  diocese: string
}

const emptyForm: ParishForm = { name: "", city: "", state: "", diocese: "" }

export const DirectoryParishes = () => {
  const { parishes, count, isLoading } = useDirectoryParishes()
  const createParish = useCreateDirectoryParish()
  const updateParish = useUpdateDirectoryParish()
  const deleteParish = useDeleteDirectoryParish()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ParishForm>(emptyForm)

  const handleSubmit = async () => {
    if (editingId) {
      await updateParish.mutateAsync({ id: editingId, ...form })
    } else {
      await createParish.mutateAsync(form)
    }
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (parish: any) => {
    setEditingId(parish.id)
    setForm({
      name: parish.name || "",
      city: parish.city || "",
      state: parish.state || "",
      diocese: parish.diocese || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this parish?")) {
      await deleteParish.mutateAsync(id)
    }
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <Heading level="h1">Directory Parishes</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {count ?? 0} parishes total
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={() => {
            setEditingId(null)
            setForm(emptyForm)
            setShowForm(true)
          }}
        >
          Add Parish
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-ui-bg-subtle">
          <Heading level="h2" className="mb-4">
            {editingId ? "Edit Parish" : "Add Parish"}
          </Heading>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="parish-name">Name</Label>
              <Input
                id="parish-name"
                placeholder="Parish name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="parish-city">City</Label>
              <Input
                id="parish-city"
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="parish-state">State</Label>
              <Input
                id="parish-state"
                placeholder="State"
                value={form.state}
                onChange={(e) =>
                  setForm({ ...form, state: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="parish-diocese">Diocese</Label>
              <Input
                id="parish-diocese"
                placeholder="Diocese"
                value={form.diocese}
                onChange={(e) =>
                  setForm({ ...form, diocese: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={handleSubmit}
              isLoading={
                createParish.isPending || updateParish.isPending
              }
            >
              {editingId ? "Update" : "Create"}
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !parishes?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No parishes found
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_1fr_100px_1fr_120px] gap-4 px-4 py-2 border-b bg-ui-bg-subtle">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Name
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              City
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              State
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Diocese
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Actions
            </Text>
          </div>
          <div className="divide-y">
            {(parishes as any[]).map((parish: any) => (
              <div
                key={parish.id}
                className="grid grid-cols-[1fr_1fr_100px_1fr_120px] gap-4 px-4 py-3 items-center hover:bg-ui-bg-subtle"
              >
                <Text className="font-medium">{parish.name}</Text>
                <Text className="text-ui-fg-subtle">{parish.city}</Text>
                <Text className="text-ui-fg-subtle">{parish.state}</Text>
                <Text className="text-ui-fg-subtle">{parish.diocese}</Text>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(parish)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(parish.id)}
                    isLoading={deleteParish.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
