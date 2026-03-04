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
  useDirectoryCategories,
  useCreateDirectoryCategory,
  useUpdateDirectoryCategory,
  useDeleteDirectoryCategory,
} from "../../../hooks/api/directory"

type CategoryForm = {
  name: string
  slug: string
  sort_order: number
}

const emptyForm: CategoryForm = { name: "", slug: "", sort_order: 0 }

export const DirectoryCategories = () => {
  const { categories, count, isLoading } = useDirectoryCategories()
  const createCategory = useCreateDirectoryCategory()
  const updateCategory = useUpdateDirectoryCategory()
  const deleteCategory = useDeleteDirectoryCategory()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)

  const handleSubmit = async () => {
    if (editingId) {
      await updateCategory.mutateAsync({ id: editingId, ...form })
    } else {
      await createCategory.mutateAsync(form)
    }
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (category: any) => {
    setEditingId(category.id)
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      sort_order: category.sort_order ?? 0,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      await deleteCategory.mutateAsync(id)
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
          <Heading level="h1">Directory Categories</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {count ?? 0} categories total
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
          Add Category
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-ui-bg-subtle">
          <Heading level="h2" className="mb-4">
            {editingId ? "Edit Category" : "Add Category"}
          </Heading>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="Category name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                placeholder="category-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="cat-order">Sort Order</Label>
              <Input
                id="cat-order"
                type="number"
                placeholder="0"
                value={String(form.sort_order)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sort_order: parseInt(e.target.value) || 0,
                  })
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
                createCategory.isPending || updateCategory.isPending
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
      ) : !categories?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No categories found
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_1fr_100px_120px] gap-4 px-4 py-2 border-b bg-ui-bg-subtle">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Name
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Slug
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Sort Order
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Actions
            </Text>
          </div>
          <div className="divide-y">
            {(categories as any[]).map((category: any) => (
              <div
                key={category.id}
                className="grid grid-cols-[1fr_1fr_100px_120px] gap-4 px-4 py-3 items-center hover:bg-ui-bg-subtle"
              >
                <Text className="font-medium">{category.name}</Text>
                <Text className="text-ui-fg-subtle">{category.slug}</Text>
                <Text className="text-ui-fg-subtle">
                  {category.sort_order}
                </Text>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(category.id)}
                    isLoading={deleteCategory.isPending}
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
