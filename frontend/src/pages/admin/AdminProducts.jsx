import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteProduct, fetchProducts } from "../../api/productApi";
import { fetchCategories } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import Modal from "../../components/common/Modal";
import PageLoader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import { PLACEHOLDER_IMG } from "../../utils/constants";
import { formatPrice, getProductImage, toNumber, truncate } from "../../utils/format";

const filterSelectClass =
  "w-full max-w-[150px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none transition focus:border-admin-500 focus:ring-1 focus:ring-admin-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const priceOptions = [
  { value: "", label: "Any price" },
  { value: "0-1000", label: "৳0 – 1,000" },
  { value: "1000-5000", label: "৳1,000 – 5,000" },
  { value: "5000-10000", label: "৳5,000 – 10,000" },
  { value: "10000-50000", label: "৳10,000 – 50,000" },
  { value: "50000-1000000", label: "৳50,000 +" },
];

const stockOptions = [
  { value: "", label: "Any stock" },
  { value: "in-stock", label: "In stock" },
  { value: "limited", label: "Low stock (1–5)" },
  { value: "out-of-stock", label: "Out of stock" },
];

const ratingOptions = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
  { value: "1", label: "1★ & up" },
];

export default function AdminProducts() {
  const { title } = useOutletContext();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);

  const [data, setData] = useState({ products: [], totalProducts: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryList, setCategoryList] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const price = searchParams.get("price") || "";
  const ratings = searchParams.get("ratings") || "";
  const availability = searchParams.get("availability") || "";
  const hasFilters = Boolean(category || price || ratings || availability);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategoryList((res.categories || []).map((c) => c.name)))
      .catch(() => setCategoryList([]));
  }, []);

  const buildParams = () => {
    const params = { page };
    if (search) params.search = search;
    if (category) params.category = category;
    if (price) params.price = price;
    if (ratings) params.ratings = ratings;
    if (availability) params.availability = availability;
    return params;
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    setSearchParams(next);
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts(buildParams())
      .then(setData)
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load products")))
      .finally(() => setLoading(false));
  }, [page, search, category, price, ratings, availability, toast]);

  const applySearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set("search", query.trim());
    else next.delete("search");
    next.set("page", "1");
    setSearchParams(next);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteProduct(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      const refreshed = await fetchProducts(buildParams());
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
          <h2 className="text-xl font-bold uppercase">Products</h2>
          <Link to="/admin/product/add" className="btn-admin">
            <Plus size={16} /> New Product
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={applySearch} className="relative">
            <input
              className="admin-input w-64 pl-9"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          </form>
          <div className="flex items-center gap-3">
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-admin-600 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
            <p className="text-sm text-gray-500">{data.totalProducts} products</p>
          </div>
        </div>

        {loading ? (
          <PageLoader label="Loading products..." />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-th">Product</th>
                    <th className="table-th">
                      <div className="space-y-1.5">
                        <span className="block">Category</span>
                        <select
                          aria-label="Filter by category"
                          className={filterSelectClass}
                          value={category}
                          onChange={(e) => setFilter("category", e.target.value)}
                        >
                          <option value="">All categories</option>
                          {categoryList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="table-th">
                      <div className="space-y-1.5">
                        <span className="block">Price</span>
                        <select
                          aria-label="Filter by price"
                          className={filterSelectClass}
                          value={price}
                          onChange={(e) => setFilter("price", e.target.value)}
                        >
                          {priceOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="table-th">
                      <div className="space-y-1.5">
                        <span className="block">Stock</span>
                        <select
                          aria-label="Filter by stock"
                          className={filterSelectClass}
                          value={availability}
                          onChange={(e) => setFilter("availability", e.target.value)}
                        >
                          {stockOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="table-th">
                      <div className="space-y-1.5">
                        <span className="block">Ratings</span>
                        <select
                          aria-label="Filter by rating"
                          className={filterSelectClass}
                          value={ratings}
                          onChange={(e) => setFilter("ratings", e.target.value)}
                        >
                          {ratingOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 transition hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product) || PLACEHOLDER_IMG}
                            alt=""
                            className="h-10 w-10 rounded-md bg-gray-100 object-contain p-1 dark:bg-gray-800"
                          />
                          <span className="font-medium">{truncate(product.name, 40)}</span>
                        </div>
                      </td>
                      <td className="table-td">{product.category || "--"}</td>
                      <td className="table-td font-semibold">{formatPrice(product.price)}</td>
                      <td className="table-td">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            toNumber(product.stock) > 5
                              ? "bg-green-100 text-green-700"
                              : toNumber(product.stock) > 0
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {toNumber(product.stock)}
                        </span>
                      </td>
                      <td className="table-td">{Number(product.ratings || 0).toFixed(1)} ★</td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1.5">
                          <Link
                            to={`/admin/product/${product.id}/edit`}
                            className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:border-admin-500 hover:text-admin-600 dark:border-gray-700"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setToDelete(product)}
                            className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-td py-10 text-center text-gray-500">
                        No products found.
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

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete product">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{toDelete?.name}</span>? This action cannot be undone.
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
