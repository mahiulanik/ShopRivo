import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import { deleteUser, fetchAllUsers, updateUserRole } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import PageLoader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate, truncate } from "../../utils/format";

const ROLES = ["User", "Uploader", "Admin"];
const roleSelectClass =
  "w-32 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none transition focus:border-admin-500 focus:ring-1 focus:ring-admin-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

export default function AdminCustomers() {
  const { title } = useOutletContext();
  const toast = useToast();
  const { user: currentUser, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);

  const [data, setData] = useState({ users: [], totalUsers: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [roleLoading, setRoleLoading] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchAllUsers(page)
      .then(setData)
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load customers")))
      .finally(() => setLoading(false));
  }, [page, toast]);

  const filtered = query.trim()
    ? data.users.filter(
        (u) =>
          u.name?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
      )
    : data.users;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteUser(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      const refreshed = await fetchAllUsers(page);
      setData(refreshed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  const changeRole = async (u, nextRole) => {
    // Only an admin may change roles, and never their own.
    if (!isAdmin || !nextRole || nextRole === u.role || u.id === currentUser?.id) return;
    setRoleLoading(u.id);
    try {
      const res = await updateUserRole(u.id, nextRole);
      toast.success(res.message || `Role updated to ${nextRole}`);
      const refreshed = await fetchAllUsers(page);
      setData(refreshed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Role update failed"));
    } finally {
      setRoleLoading(null);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="admin-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase">Customers</h2>
          <p className="text-sm text-gray-500">{data.totalUsers} customers</p>
        </div>

        <div className="relative mb-4 max-w-xs">
          <input
            className="admin-input pl-9"
            placeholder="Search name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>

        {loading ? (
          <PageLoader label="Loading customers..." />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="table-th">Avatar</th>
                    <th className="table-th">Name</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Joined</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 transition hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/40"
                    >
                      <td className="table-td">
                        <Avatar
                          src={u.avatar?.url}
                          name={u.name}
                          className="h-9 w-9"
                          fallbackClassName="bg-admin-600/15 text-xs text-admin-600"
                        />
                      </td>
                      <td className="table-td font-medium">{truncate(u.name, 28)}</td>
                      <td className="table-td">{u.email}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={u.role} />
                        </div>
                      </td>
                      <td className="table-td">{formatDate(u.created_at)}</td>
                      <td className="table-td text-right">
                        <select
                          aria-label={`Change role for ${u.name}`}
                          className={`${roleSelectClass} mr-2`}
                          value={u.role}
                          disabled={u.id === currentUser?.id || roleLoading === u.id}
                          onChange={(e) => changeRole(u, e.target.value)}
                          title={
                            u.id === currentUser?.id
                              ? "You cannot change your own role"
                              : "Change role"
                          }
                        >
                          {u.id === currentUser?.id ? (
                            <option value={u.role}>{u.role} (you)</option>
                          ) : (
                            ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role === u.role ? `${role} (current)` : role}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          onClick={() => setToDelete(u)}
                          disabled={u.id === currentUser?.id}
                          className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-500 hover:text-red-600 disabled:opacity-30 dark:border-gray-700"
                          title="Delete customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-td py-10 text-center text-gray-500">
                        No customers found.
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

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete customer">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete <span className="font-semibold">{toDelete?.name}</span>? Their account will be
          permanently removed.
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
