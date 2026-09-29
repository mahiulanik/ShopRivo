import { useState } from "react";
import { Camera, KeyRound, Save, User } from "lucide-react";
import { changePassword, updateProfile } from "../../api/authApi";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Avatar from "../../components/common/Avatar";

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Image must be smaller than 1 MB");
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      if (avatar) formData.append("avatar", avatar);
      const res = await updateProfile(formData);
      toast.success(res.message);
      const updated = await refreshUser();
      setAvatarPreview(updated?.avatar?.url || res.user?.avatar?.url || avatarPreview);
      setAvatar(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Profile update failed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await changePassword(pwd);
      toast.success(res.message);
      setPwd({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Password change failed"));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold">
        <User size={24} /> Manage Account
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card p-6">
          <h2 className="mb-5 font-bold">Profile Details</h2>

          <div className="mb-5 flex items-center gap-4">
            <Avatar
              src={avatarPreview}
              name={user?.name}
              className="h-16 w-16"
              fallbackClassName="bg-brand-700 text-xl text-white"
            />
            <label className="btn-outline cursor-pointer">
              <Camera size={15} /> Change photo
              <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" disabled value={user?.role || ""} />
            </div>
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary mt-5">
            <Save size={15} /> {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <form onSubmit={savePassword} className="card h-max p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold">
            <KeyRound size={17} /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                className="input"
                required
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                required
                minLength={8}
                maxLength={16}
                placeholder="8-16 characters"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                required
                value={pwd.confirmNewPassword}
                onChange={(e) => setPwd({ ...pwd, confirmNewPassword: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={savingPwd} className="btn-primary mt-5">
            {savingPwd ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
