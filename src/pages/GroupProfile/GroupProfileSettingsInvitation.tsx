import { Modal } from "antd";
import { toast } from "react-toastify";
import { MailIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import BoxTinyMCE from "@/components/boxTinyMCE";
import type IGroup from "@/interfaces/group.interface";
import { updateInvitationGroup } from "@/services/group";

function GroupProfileInvitation({
  accessToken,
  group,
  setGroup,
}: {
  accessToken: string;
  group: IGroup | undefined;
  setGroup: React.Dispatch<React.SetStateAction<IGroup | undefined>>;
}) {
  const [invitation, setInvitation] = useState("");
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);

  useEffect(() => {
    if (group) {
      setInvitation(group.invitation);
    }
  }, [group]);

  const showInvitationModal = () => {
    setIsInvitationModalOpen(true);
  };

  const handleInvitationOk = async () => {
    if (group) {
      try {
        const response = await updateInvitationGroup({
          accessToken,
          id: group._id,
          invitation,
        });
        if (response.status === 200) {
          setGroup({ ...group, invitation: response.data.data.invitation });
          toast.success("Update successfully.");
        }
      } catch {
        toast.error("Update failed. Plase try again.");
      }
    }

    setIsInvitationModalOpen(false);
  };

  const handleInvitationCancel = () => {
    if (group) {
      setInvitation(group.invitation);
    }

    setIsInvitationModalOpen(false);
  };

  return (
    <>
      <Modal
        title="Edit Invitation"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isInvitationModalOpen}
        onOk={handleInvitationOk}
        onCancel={handleInvitationCancel}
      >
        <BoxTinyMCE
          label="Invitation"
          initialValue={invitation}
          setValue={setInvitation}
        />
      </Modal>

      <div
        key={"124321331311332333324213424234"}
        onClick={() => {
          showInvitationModal();
        }}
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-md border hover:bg-gray-50 transition cursor-pointer"
        )}
      >
        <div className="flex items-center space-x-3">
          <MailIcon className="text-xl text-gray-700" />
          <span className="text-[16px] font-medium">{"Invitation"}</span>
        </div>
      </div>
    </>
  );
}

export default GroupProfileInvitation;
