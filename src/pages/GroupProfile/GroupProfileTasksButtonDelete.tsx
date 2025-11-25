import { Button, Input, Modal } from "antd";
import { toast } from "react-toastify";
import { useState, type Dispatch, type SetStateAction } from "react";

import { getCookie } from "@/helpers/cookies";
import { deleteTaskGroup } from "@/services/taskGroup";
import type ITaskGroup from "@/interfaces/taskGroup.interface";

function GroupProfileTasksButtonDelete({
  taskGroup,
  setReload,
}: {
  taskGroup: ITaskGroup;
  setReload: Dispatch<SetStateAction<boolean>>;
}) {
  const accessToken = getCookie("accessToken");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleDeleteTaskGroupOk = async () => {
    try {
      if (!taskGroup || confirmSlug !== taskGroup.slug) {
        toast.warning("Invalid slug.");

        return;
      }

      await deleteTaskGroup({ accessToken, id: taskGroup._id });

      setReload((prev) => !prev);
      toast.success("Delete successfully.");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteTaskGroupCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        title="Confirm leave group"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleDeleteTaskGroupOk}
        onCancel={handleDeleteTaskGroupCancel}
      >
        <p>
          Copy the group slug to confirm{" "}
          <span className="font-bold">{taskGroup.slug}</span>
        </p>

        <div className="mt-2">
          <Input
            placeholder="Enter the group name to confirm"
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
          />
        </div>
      </Modal>

      <Button htmlType="submit" onClick={showModal}>
        Delete
      </Button>
    </>
  );
}

export default GroupProfileTasksButtonDelete;
