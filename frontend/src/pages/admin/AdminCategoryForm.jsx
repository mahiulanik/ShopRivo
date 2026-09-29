import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { createCategory, fetchCategories, updateCategory } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import PageLoader from "../../components/common/Loader";

export default function AdminCategoryForm() {
  const { categoryId } = useParams();
  const isEdit = Boolean(categoryId);
  const { title } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    fetchCategories()
      .then((res) => {
        const found = (res.categories || []).find((cat) => cat.id === categoryId);
        if (!found) {
          toast.error("Category not found");
          navigate("/admin/category");
          return;
        }
        setName(found.name);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, "Failed to load category"));
        navigate("/admin/category");
      })
      .finally(() => setLoading(false));
  }, [categoryId, isEdit, navigate, toast]);

  const submit = async (e) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;

    setSaving(true);
    try {
      const res = isEdit
        ? await updateCategory(categoryId, value)
        : await createCategory(value);
      toast.success(res.message || "Category saved successfully.");
      navigate("/admin/category");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save category"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading category..." />;

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="admin-card max-w-xl p-5">
        <h2 className="mb-5 text-xl font-bold uppercase">
          {isEdit ? "Edit Category" : "New Category"}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="admin-input"
              required
              autoFocus={!isEdit}
              placeholder="eg: Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-admin">
              {saving ? "Saving..." : isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/category")}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
