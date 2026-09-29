import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import Modal from "../../components/common/Modal";
import PageLoader from "../../components/common/Loader";

export default function AdminCategories() {
  const { title } = useOutletContext();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchCategories();
      setCategories(res.categories || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setNewName("");
    setShowNew(true);
  };

  const closeNew = () => {
    setShowNew(false);
    setNewName("");
  };

  const createNew = async () => {
    const value = newName.trim();
    if (!value) {
      toast.error("Category name is required.");
      return;
    }
    setCreating(true);
    try {
      const res = await createCategory(value);
      toast.success(res.message || "Category created successfully.");
      closeNew();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create category"));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    const value = editName.trim();
    if (!value) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await updateCategory(editingId, value);
      toast.success(res.message || "Category updated successfully.");
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update category"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteCategory(toDelete.id);
      toast.success(res.message || "Category deleted successfully.");
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete category"));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading categories..." />;

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="admin-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase">All Category</h2>
          <button onClick={openNew} className="btn-admin">
            <Plus size={15} />
            New Category
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="table-th">Category Name</th>
                <th className="table-th">Products</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const isEditing = cat.id === editingId;
                return (
                  <tr
                    key={cat.id}
                    className="border-b border-gray-50 dark:border-gray-800/60"
                  >
                    <td className="table-td font-medium">
                      {isEditing ? (
                        <input
                          className="admin-input w-56 py-1.5 text-sm"
                          value={editName}
                          autoFocus
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          aria-label="Category name"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="table-td">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {cat.product_count}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="rounded-lg bg-admin-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-admin-700 disabled:opacity-60"
                          >
                            {saving ? "Saving..." : "Update"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => startEdit(cat)}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-admin-50 hover:text-admin-600 dark:hover:bg-admin-950/40"
                            aria-label={`Edit ${cat.name}`}
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setToDelete(cat)}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            aria-label={`Delete ${cat.name}`}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-td py-10 text-center text-gray-500">
                    No categories yet. Create one with the New Category button.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showNew} onClose={closeNew} title="New Category">
        <label className="label">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          className="admin-input mt-1"
          placeholder="eg: Electronics"
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") createNew();
          }}
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={closeNew} disabled={creating} className="btn-outline">
            Cancel
          </button>
          <button onClick={createNew} disabled={creating} className="btn-admin">
            {creating ? "Saving..." : "Submit"}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete category">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{toDelete?.name}</span>?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setToDelete(null)} className="btn-outline">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={deleting} className="btn-danger">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
