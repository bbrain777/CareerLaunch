import { useState, useEffect } from "react";
import { Input, Field } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/queries";
import { appToastManager } from "@/lib/toast";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { data: profileData } = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const [formData, setFormData] = useState({
    fullName: user?.name || "User",
    email: user?.email || "",
    role: user?.currentRole || "",
    targetRole: user?.targetRole || "",
    weeklyGoal: String(user?.weeklyGoal || 5),
  });

  const activeUser = profileData?.user || user;

  useEffect(() => {
    if (activeUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: activeUser.name || prev.fullName,
        email: activeUser.email || prev.email,
        role: activeUser.currentRole || "",
        targetRole: activeUser.targetRole || "",
        weeklyGoal: String(activeUser.weeklyGoal || 5),
      }));
    }
  }, [activeUser]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activeUser) {
      try {
        const response = await updateProfileMutation.mutateAsync({
          name: formData.fullName,
          email: formData.email,
          currentRole: formData.role,
          targetRole: formData.targetRole,
          weeklyGoal: Number(formData.weeklyGoal),
        });
        updateUser(response.user);

        appToastManager.add({
          title: "Profile saved",
          description: response?.user?.name
            ? `Updated profile for ${response.user.name}`
            : "Your changes have been saved successfully.",
          variant: "success",
        });
      } catch {
        return;
      }
    }
  };

  const initials = (formData.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 py-2 pb-12">
      {/* Page Header */}
      <div>
        <span className="text-[12px] font-medium text-[#8c8880] tracking-wide uppercase">
          Account
        </span>
        <h1 className="text-[23px] font-semibold text-[#1d1c1a] tracking-tight mt-0.5">
          Profile and settings
        </h1>
        <p className="mt-1 text-[13.5px] text-[#57544e]">
          Manage your career targets, preferences, and personal details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Avatar / Overview Card */}
        <div className="flex items-center gap-4 rounded-[10px] bg-white border border-[#e9e7e2] p-5 shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
          <div className="size-14 rounded-full bg-[#0a5c4d]/10 border border-[#0a5c4d]/20 flex items-center justify-center text-[18px] font-semibold text-[#0a5c4d]">
            {initials}
          </div>
          <div>
            <div className="text-[16px] font-semibold text-[#1d1c1a]">
              {formData.fullName || "User"}
            </div>
            <div className="text-[13px] text-[#57544e]">
              {formData.email || "No email provided"}
            </div>
            {formData.role && (
              <div className="mt-1 inline-flex items-center rounded-full bg-[#f6f5f2] border border-[#e9e7e2] px-2 py-0.5 text-[11px] font-medium text-[#57544e]">
                {formData.role}
              </div>
            )}
          </div>
        </div>

        {/* Personal Information Panel */}
        <div className="rounded-[10px] bg-white border border-[#e9e7e2] p-5 shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
          <div className="border-b border-[#f0eeea] pb-3 mb-4">
            <h2 className="text-[14px] font-semibold text-[#1d1c1a]">
              Personal information
            </h2>
            <p className="text-[12px] text-[#8c8880] mt-0.5">
              Update your personal and contact details
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name">
              <Input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
              />
            </Field>

            <Field label="Email address">
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Current role">
              <Input
                id="role"
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Career Targets Panel */}
        <div className="rounded-[10px] bg-white border border-[#e9e7e2] p-5 shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
          <div className="border-b border-[#f0eeea] pb-3 mb-4">
            <h2 className="text-[14px] font-semibold text-[#1d1c1a]">
              Career targets
            </h2>
            <p className="text-[12px] text-[#8c8880] mt-0.5">
              Define your aspirational roles and weekly goal pace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Target role">
              <Input
                id="targetRole"
                type="text"
                placeholder="e.g. Staff Engineer / Lead"
                value={formData.targetRole}
                onChange={(e) => handleChange("targetRole", e.target.value)}
              />
            </Field>

            <Field label="Target weekly applications">
              <Input
                id="weeklyGoal"
                type="number"
                min="1"
                required
                value={formData.weeklyGoal}
                onChange={(e) => handleChange("weeklyGoal", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="inline-flex h-[30px] w-auto items-center justify-center gap-1.5 rounded-lg bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] px-4 text-[12.5px] font-medium text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {updateProfileMutation.isPending ? (
              <>
                <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                <span>Saving profile...</span>
              </>
            ) : (
              "Save profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
