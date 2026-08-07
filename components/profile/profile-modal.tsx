"use client";

import { Button, Input, Modal } from "@heroui/react";
import { UserRoundIcon } from "lucide-react";
import type { ProfileModel } from "@/lib/profile/to-profile-input";
import { toProfileInput } from "@/lib/profile/to-profile-input";
import { ProfileWizard } from "@/components/profile/profile-wizard";
import { FormField } from "@/components/profile/form-field";

export type ProfileModalUser = {
  role?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" ") ?? "",
  };
}

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
  const { first, last } = user.firstName
    ? { first: user.firstName, last: user.lastName ?? "" }
    : splitName(user.name);
  const email = user.email ?? "";
  const fullName = `${first} ${last}`.trim() || "User";

  return (
    <Modal.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Icon>
                <UserRoundIcon className="size-5" />
              </Modal.Icon>
              <Modal.Heading>My Profile</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

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
            ) : profile ? (
              <ProfileWizard
                mode="update"
                initialData={toProfileInput(profile)}
                variant="modal"
                accountInfo={{ name: fullName, email }}
              />
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
