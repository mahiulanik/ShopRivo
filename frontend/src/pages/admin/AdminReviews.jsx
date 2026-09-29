import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Search, Star, Trash2 } from "lucide-react";
import { deleteReview, fetchReviews } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import Avatar from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import PageLoader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import Rating from "../../components/common/Rating";
import { PLACEHOLDER_IMG } from "../../utils/constants";
import { formatDate, truncate } from "../../utils/format";

export default function AdminReviews() {
  const { title } = useOutletContext();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);

  const [data, setData] = useState({
    reviews: [],
    totalReviews: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchReviews(page)
      .then(setData)
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load reviews")))
      .finally(() => setLoading(false));
  }, [page, toast]);

  const filtered = query.trim()
    ? data.reviews.filter(
        (r) =>
          r.product?.name?.toLowerCase().includes(query.toLowerCase()) ||
          r.reviewer?.name?.toLowerCase().includes(query.toLowerCase()) ||
          r.comment?.toLowerCase().includes(query.toLowerCase())
      )
    : data.reviews;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteReview(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      const refreshed = await fetchReviews(page);
      setData(refreshed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="admin-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase">Rating & Review</h2>
          <p className="text-sm text-gray-500">{data.totalReviews} reviews</p>
        </div>

        <div className="relative mb-4 max-w-xs">
          <input
            className="admin-input pl-9"
            placeholder="Search product, user or review..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>

        {loading ? (
          <PageLoader label="Loading reviews..." />
        ) : data.reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Customer reviews will appear here once they purchase and review a product."
          />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-th">Product</th>
                    <th className="table-th">User</th>
                    <th className="table-th">Rating</th>
                    <th className="table-th">Review</th>
                    <th className="table-th">Date</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-50 transition hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.product?.image || PLACEHOLDER_IMG}
                            alt=""
                            className="h-10 w-10 rounded-md bg-gray-100 object-contain p-1 dark:bg-gray-800"
                          />
                          <span className="font-medium">
                            {truncate(row.product?.name || "Product", 30)}
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={row.reviewer?.avatar?.url}
                            name={row.reviewer?.name}
                            className="h-7 w-7"
                            fallbackClassName="bg-admin-600/15 text-xs text-admin-600"
                            fallbackLetter="A"
                          />
                          {truncate(row.reviewer?.name || "Customer", 22)}
                        </div>
                      </td>
                      <td className="table-td">
                        <Rating value={row.rating} size={13} />
                      </td>
                      <td className="table-td max-w-xs">{truncate(row.comment, 90)}</td>
                      <td className="table-td">{formatDate(row.created_at)}</td>
                      <td className="table-td text-right">
                        <button
                          onClick={() => setToDelete(row)}
                          className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700"
                          title="Delete review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-td py-10 text-center text-gray-500">
                        No reviews match your search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              onChange={(p) => {
                const next = new URLSearchParams(searchParams);
                next.set("page", String(p));
                setSearchParams(next);
              }}
            />
          </>
        )}
      </div>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete review">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete this review by{" "}
          <span className="font-semibold">{toDelete?.reviewer?.name || "Customer"}</span> on{" "}
          <span className="font-semibold">{toDelete?.product?.name}</span>? The product's average
          rating will be recalculated.
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
