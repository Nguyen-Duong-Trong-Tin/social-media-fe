import { Modal } from "antd";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BoxTinyMCE from "@/components/boxTinyMCE";
import type { IGroup } from "@/interfaces/group.interface";
import { updateDescriptionGroup } from "@/services/group";

function GroupProfileDescription({
  accessToken,
  group,
  setGroup,
  userId,
}: {
  accessToken: string;
  group: IGroup | undefined;
  setGroup: React.Dispatch<React.SetStateAction<IGroup | undefined>>;
  userId: string;
}) {
  const [description, setDescription] = useState("");
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  useEffect(() => {
    if (group) {
      setDescription(group.description);
    }
  }, [group]);

  const showDescriptionModal = () => {
    setIsDescriptionModalOpen(true);
  };

  const handleDescriptionOk = async () => {
    if (group) {
      try {
        const response = await updateDescriptionGroup({
          accessToken,
          id: group._id,
          description,
        });
        if (response.status === 200) {
          setGroup({ ...group, description: response.data.data.description });
          toast.success("Update successfully.");
        }
      } catch {
        toast.error("Update failed. Plase try again.");
      }
    }

    setIsDescriptionModalOpen(false);
  };

  const handleDescriptionCancel = () => {
    if (group) {
      setDescription(group.description);
    }

    setIsDescriptionModalOpen(false);
  };

  return (
    <>
      <Modal
        title="Edit Description"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isDescriptionModalOpen}
        onOk={handleDescriptionOk}
        onCancel={handleDescriptionCancel}
      >
        <BoxTinyMCE
          label="Description"
          initialValue={description}
          setValue={setDescription}
        />
      </Modal>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl">About this group</CardTitle>
            </div>
            <CardAction>
              {group &&
                group.users.some(
                  (user) =>
                    (user.role === "superAdmin" || user.role === "admin") &&
                    user.userId === userId,
                ) && (
                  <Button variant="outline" onClick={showDescriptionModal}>
                    Edit
                  </Button>
                )}
            </CardAction>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Members
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {group?.users?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Active community size
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Join requests
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {group?.userRequests?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Waiting for approval
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Invitations
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {group?.usersInvited?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Pending invites sent
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <p className="mt-1 text-lg font-semibold">
              {group?.status ?? "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default GroupProfileDescription;
