import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Clapperboard, Info, Trash2 } from "lucide-react";
import { fetchMedia, deleteMedia } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import EmptyState from "../../components/common/EmptyState";
import PageLoader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import { formatDate } from "../../utils/format";

export default function AdminMedia() {
  const { title } = useOutletContext();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMedia()
      .then((res) => {
        if (!cancelled) setItems(res.media || []);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err, "Failed to load media"));
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const removeMedia = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteMedia(selected.id);
      toast.success("Media deleted permanently.");
      setItems((prev) => prev.filter((item) => item.id !== selected.id));
      setSelected(null);
      setConfirmOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete media"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading media..." />;

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="mb-4 flex gap-2 rounded-lg border border-admin-200 bg-admin-50 p-4 text-sm text-admin-800 dark:border-admin-900 dark:bg-admin-950/40 dark:text-admin-300">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Images uploaded to products are kept here even after they are removed from a product.
          Deleting from this page removes them permanently, including from Cloudinary storage.
        </span>
      </div>

      <div className="admin-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase">Media</h2>
          <span className="text-sm text-gray-500">{items.length} file(s)</span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Clapperboard}
            title="No media yet"
            description="Images you add to products will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800"
              >
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {formatDate(item.created_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Media details">
        {selected ? (
          <div>
            <img
              src={selected.url}
              alt=""
              className="mb-4 h-56 w-full rounded-lg border border-gray-100 object-contain dark:border-gray-800"
            />
            <dl className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Cloudinary ID</dt>
                <dd className="truncate font-mono text-xs">{selected.public_id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Uploaded</dt>
                <dd>{formatDate(selected.created_at)}</dd>
              </div>
            </dl>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn-danger"
              >
                <Trash2 size={15} /> Delete Permanently
              </button>
              <button onClick={() => setSelected(null)} className="btn-outline">
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete media">
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
          This image will be removed from the library <strong>and permanently deleted from
          Cloudinary</strong>. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={removeMedia} disabled={deleting} className="btn-danger">
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button onClick={() => setConfirmOpen(false)} className="btn-outline">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
