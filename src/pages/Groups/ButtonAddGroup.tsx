import {
  Button,
  Form,
  Input,
  Modal,
  Upload,
  type FormProps,
  type GetProp,
  type UploadFile,
  type UploadProps,
} from "antd";
import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";

import { getCookie } from "@/helpers/cookies";
import type IGroupTopic from "@/interfaces/groupTopic.interface";

type FieldType = {
  title: string;
  avatar: UploadFile[];
  coverPhoto: UploadFile[];
};
type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];
const v1 = import.meta.env.VITE_BACKEND_V1;

function ButtonAddGroup({
  reload,
  setReload,
  groupTopic,
}: {
  reload: boolean,
  setReload: Dispatch<SetStateAction<boolean>>;
  groupTopic: IGroupTopic;
}) {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarFileList, setAvatarFileList] = useState<UploadFile[]>([]);
  const [coverPhotoFileList, setCoverPhotoFileList] = useState<UploadFile[]>(
    []
  );
  const [isButtonLoading, setiSButtonLoading] = useState(false);

  const onChangeAvatar: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
    setAvatarFileList(newFileList);
  };

  const onChangeCoverPhoto: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
    setCoverPhotoFileList(newFileList);
  };

  const onPreviewAvatar = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const onPreviewCoverPhoto = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setiSButtonLoading(true);

    try {
      const fd = new FormData();

      fd.append("title", values.title ?? "");
      fd.append("description", "");
      fd.append("status", "active");
      fd.append("userId", userId);
      fd.append("groupTopicId", groupTopic._id);

      const avatarList = values.avatar || avatarFileList || [];
      if (avatarList.length > 0) {
        const av = avatarList[0] as any;
        const fileObj: File | undefined =
          av?.originFileObj ?? av?.originFile ?? undefined;
        if (fileObj) {
          fd.append("avatar", fileObj);
        }
      }

      const coverList = values.coverPhoto || coverPhotoFileList || [];
      if (coverList.length > 0) {
        const cv = coverList[0] as any;
        const fileObj: File | undefined =
          cv?.originFileObj ?? cv?.originFile ?? undefined;
        if (fileObj) {
          fd.append("coverPhoto", fileObj);
        }
      }

      const url = `${v1}/groups`;
      const res = await fetch(url, {
        method: "POST",
        body: fd,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        let errMsg = `Upload failed: ${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.message) errMsg = json.message;
        } catch {
          try {
            const text = await res.text();
            if (text) errMsg = text;
          } catch {}
        }
        throw new Error(errMsg);
      }

      await res.json().catch(() => ({}));
      toast.success("Create group successfully.");
      setReload(!reload);
      setIsModalOpen(false);
      setAvatarFileList([]);
      setCoverPhotoFileList([]);
    } catch {
      toast.error("Something went wrong.");
    }

    setiSButtonLoading(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const normFile = (e: any) => {
    if (!e) return [];
    return e.fileList;
  };

  return (
    <>
      <Modal
        title="Add Group"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          method="POST"
          encType="multipart/form-data"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              {
                required: true,
                message: "Please input your title!",
              },
            ]}
          >
            <Input type="text" />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="Avatar"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: "Please choose a file!" }]}
          >
            <Upload
              listType="picture-card"
              fileList={avatarFileList}
              onChange={onChangeAvatar}
              onPreview={onPreviewAvatar}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {avatarFileList.length < 1 && "+ Upload"}
            </Upload>
          </Form.Item>

          <Form.Item
            name="coverPhoto"
            label="Cover photo"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: "Please choose a file!" }]}
          >
            <Upload
              listType="picture-card"
              fileList={coverPhotoFileList}
              onChange={onChangeCoverPhoto}
              onPreview={onPreviewCoverPhoto}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {coverPhotoFileList.length < 1 && "+ Upload"}
            </Upload>
          </Form.Item>

          <Form.Item className="flex justify-end" label={null}>
            <Button type="primary" htmlType="submit" loading={isButtonLoading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Button type="primary" onClick={showModal}>
        +
      </Button>
    </>
  );
}

export default ButtonAddGroup;
