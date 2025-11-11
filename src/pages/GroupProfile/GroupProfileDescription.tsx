import { Modal } from "antd";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BoxTinyMCE from "@/components/boxTinyMCE";
import type IGroup from "@/interfaces/group.interface";
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
        <CardHeader>
          <CardTitle>Intro</CardTitle>
          <CardDescription dangerouslySetInnerHTML={{ __html: description }} />
          <CardAction>
            {group &&
              group.users.some(
                (user) => user.role === "superAdmin" && user.userId === userId
              ) && (
                <Button variant="outline" onClick={showDescriptionModal}>
                  Edit
                </Button>
              )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </>
  );
}

export default GroupProfileDescription;
