"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@heroui/react";
import type { ProfileModel } from "@/lib/profile/to-profile-input";
import { toProfileInput } from "@/lib/profile/to-profile-input";
import { FormModal } from "@/components/ui/form-modal";
import { FormField } from "@/components/ui/form-field";
import { UpdateProfileForm } from "@/components/profile/update-profile-form";
import { useProfile } from "@/components/profile/use-profile";
import { splitName } from "@/lib/user-name";

export type ProfileModalUser = {
  role?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <FormField label={label}>
      <Input.Root disabled fullWidth value={value} />
    </FormField>
  );
}

export function ProfileModal({
  user,
  profile,
  isOpen,
  onOpenChange,
}: {
  user: ProfileModalUser;
  profile: ProfileModel | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isAdmin = user.role === "admin";
  const [savePending, setSavePending] = useState(false);
  const { data: profileData } = useProfile(profile, !isAdmin);
  const activeProfile = profileData ?? profile;
  const { first, last } = user.firstName
    ? { first: user.firstName, last: user.lastName ?? "" }
    : splitName(user.name);
  const email = user.email ?? "";

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="My Profile"
      closeDisabled={savePending}
    >
      {isAdmin ? (
        <>
          <Modal.Body>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="First name" value={first} />
              <ReadOnlyField label="Last name" value={last} />
            </div>
            <div className="mt-4">
              <ReadOnlyField label="Email" value={email} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button.Root
              type="button"
              variant="ghost"
              onPress={() => onOpenChange(false)}
              className="text-zinc-600"
            >
              Close
            </Button.Root>
          </Modal.Footer>
        </>
      ) : activeProfile ? (
        <UpdateProfileForm
          key={JSON.stringify(activeProfile)}
          user={user}
          initialData={toProfileInput(activeProfile)}
          onSuccess={() => onOpenChange(false)}
          onPendingChange={setSavePending}
        />
      ) : null}
    </FormModal>
  );
}