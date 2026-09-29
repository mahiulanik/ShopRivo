import { useEffect, useState } from "react";
import { createAddress, updateAddress } from "../../api/addressApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Modal from "../common/Modal";
import { COUNTRIES, DISTRICTS } from "../../utils/constants";

const emptyForm = {
  contact_name: "",
  phone: "",
  address: "",
  area: "",
  city: "",
  district: "",
  pincode: "",
  country: "Bangladesh",
};

export default function AddressModal({ open, address, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (address) {
      setForm({
        contact_name: address.contact_name || "",
        phone: address.phone || "",
        address: address.address || "",
        area: address.area || "",
        city: address.city || "",
        district: address.district || "",
        pincode: address.pincode ?? address.postal_code ?? "",
        country: address.country || "Bangladesh",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, address]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const digits = form.phone.replace(/[^0-9]/g, "");
    if (digits.length < 6 || digits.length > 15) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setSaving(true);
    try {
      const res = address
        ? await updateAddress(address.id, form)
        : await createAddress(form);
      toast.success(res.message || "Address saved");
      onSaved?.(res.address, Boolean(address));
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save address"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={address ? "Edit Delivery Address" : "Add Delivery Address"}
      width="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              className="input pr-12"
              required
              maxLength={100}
              placeholder="Name"
              name="contact_name"
              value={form.contact_name}
              onChange={onChange}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {form.contact_name.length}/100
            </span>
          </div>
        </div>

        <div>
          <label className="label">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            required
            placeholder="01812-345678"
            name="phone"
            value={form.phone}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="label">
            Street , House/Apartment/Unit <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            required
            placeholder="Address"
            name="address"
            value={form.address}
            onChange={onChange}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Area</label>
            <input
              className="input"
              placeholder="e.g. Dhanmondi"
              name="area"
              value={form.area}
              onChange={onChange}
            />
          </div>
          <div>
            <label className="label">
              City <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              required
              placeholder="City"
              name="city"
              value={form.city}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">
              District <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              required
              name="district"
              value={form.district}
              onChange={onChange}
            >
              <option value="">Select District</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              required
              placeholder="Postal code"
              name="pincode"
              value={form.pincode}
              onChange={onChange}
            />
          </div>
        </div>

        <div>
          <label className="label">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            className="input"
            required
            name="country"
            value={form.country}
            onChange={onChange}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
