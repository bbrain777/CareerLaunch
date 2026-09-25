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

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 py-2 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Profile and settings
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Manage your career targets, preferences, and personal details
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col gap-5 rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0">
          <h2 className="m-0 pb-1 text-base font-semibold text-gray-900">
            Personal information
          </h2>

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

          <Field label="Current role">
            <Input
              id="role"
              type="text"
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-5 rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0">
          <h2 className="m-0 pb-1 text-base font-semibold text-gray-900">
            Career targets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Target role">
              <Input
                id="targetRole"
                type="text"
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="inline-flex h-10 w-auto items-center justify-center gap-2 rounded-xl bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] px-6 text-sm font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateProfileMutation.isPending ? (
              <>
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                <span>Saving...</span>
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
