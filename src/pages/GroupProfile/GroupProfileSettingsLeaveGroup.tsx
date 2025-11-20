import { useState } from "react";
import { Input, Modal } from "antd";
import { LogOut } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { getCookie } from "@/helpers/cookies";
import { leaveGroup } from "@/services/group";
import type IGroup from "@/interfaces/group.interface";

function GroupProfileSettingsLeaveGroup({
  accessToken,
  group,
}: {
  accessToken: string;
  group: IGroup | undefined;
}) {
  const userId = getCookie("userId");

  const navigate = useNavigate();

  const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  const showLeaveGroupModal = () => {
    setIsLeaveGroupModalOpen(true);
  };

  const handleLeaveGroupOk = async () => {
    if (!group || confirmSlug !== group.slug) {
      toast.warning("Invalid slug.");

      return;
    }

    try {
      await leaveGroup({ accessToken, id: group._id, userId });

      toast.success("You have left the group.");

      navigate("/");
    } catch {
      toast.error("Something went wrong.");
    }

    setIsLeaveGroupModalOpen(false);
  };

  const handleLeaveGroupCancel = () => {
    setIsLeaveGroupModalOpen(false);
  };

  return (
    <>
      {group && (
        <>
          <Modal
            title="Confirm leave group"
            closable={{ "aria-label": "Custom Close Button" }}
            open={isLeaveGroupModalOpen}
            onOk={handleLeaveGroupOk}
            onCancel={handleLeaveGroupCancel}
          >
            <p>
              Copy the group slug to confirm{" "}
              <span className="font-bold">{group.slug}</span>
            </p>

            <div className="mt-2">
              <Input
                placeholder="Enter the group name to confirm"
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
              />
            </div>
          </Modal>

          <div
            onClick={() => {
              showLeaveGroupModal();
            }}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-md border hover:bg-gray-50 transition cursor-pointer mt-2"
            )}
          >
            <div className="flex items-center space-x-3 text-red-600">
              <LogOut className="text-xl" />
              <span className="text-[16px] font-medium">Leave group</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default GroupProfileSettingsLeaveGroup;
