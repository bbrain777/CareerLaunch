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
    role: "Senior Software Engineer",
    targetRole: "Lead Fullstack Engineer / Tech Lead",
    weeklyGoal: "5",
  });

  const activeUser = profileData?.user || user;

  useEffect(() => {
    if (activeUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: activeUser.name || prev.fullName,
        email: activeUser.email || prev.email,
      }));
    }
  }, [activeUser]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (activeUser) {
      const updatedUser = {
        ...activeUser,
        name: formData.fullName,
        email: formData.email,
      };
      updateUser(updatedUser);
      try {
        const response = await updateProfileMutation.mutateAsync({
          fullName: formData.fullName,
          email: formData.email,
        });

        appToastManager.add({
          title: "Profile saved",
          description: response?.user?.name
            ? `Updated profile for ${response.user.name}`
            : "Your changes have been saved successfully.",
          variant: "success",
        });
      } catch (err: any) {
        appToastManager.add({
          title: "Profile updated locally",
          description: "Saved locally to your browser session.",
          variant: "info",
        });
      }
    }
  };

  return (
    <div className="profile-page-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">
            Profile and settings
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Manage your career targets, preferences, and personal details
          </p>
        </div>
      </div>

      <div className="profile-card">
        <h2 className="profile-card-title">
          Personal information
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name">
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="form-input"
              />
            </Field>

            <Field label="Email address">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Current role">
            <Input
              id="role"
              type="text"
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="form-input"
            />
          </Field>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="btn-primary-auth !w-auto !px-6"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="profile-card">
        <h2 className="profile-card-title">
          Career targets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Target role">
            <Input
              id="targetRole"
              type="text"
              value={formData.targetRole}
              onChange={(e) => handleChange("targetRole", e.target.value)}
              className="form-input"
            />
          </Field>

          <Field label="Target weekly applications">
            <Input
              id="weeklyGoal"
              type="number"
              value={formData.weeklyGoal}
              onChange={(e) => handleChange("weeklyGoal", e.target.value)}
              className="form-input"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
