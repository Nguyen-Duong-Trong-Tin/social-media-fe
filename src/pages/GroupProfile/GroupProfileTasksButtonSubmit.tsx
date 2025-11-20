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
import { toast } from "react-toastify";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { getCookie } from "@/helpers/cookies";
import BoxTinyMCE from "@/components/boxTinyMCE";
import type ITaskGroup from "@/interfaces/taskGroup.interface";
import { UploadOutlined, EditOutlined } from "@ant-design/icons";
import type ITaskGroupSubmission from "@/interfaces/taskGroupSubmission.interface";

type FieldType = {
  title: string;
  images: UploadFile[];
  videos: UploadFile[];
  materials: UploadFile[];
};
type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];
const v1 = import.meta.env.VITE_BACKEND_V1;

function GroupProfileTasksButtonSubmit({
  setReload,
  taskGroup,
  taskGroupSubmission,
}: {
  setReload: Dispatch<SetStateAction<boolean>>;
  taskGroup: ITaskGroup;
  taskGroupSubmission: ITaskGroupSubmission | null;
}) {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const [form] = Form.useForm<FieldType>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [imageFileListRemoved, setImageFileListRemoved] = useState<string[]>(
    []
  );
  const [videoFileList, setVideoFileList] = useState<UploadFile[]>([]);
  const [videoFileListRemoved, setVideoFileListRemoved] = useState<string[]>(
    []
  );
  const [materialFileList, setMaterialFileList] = useState<UploadFile[]>([]);
  const [materialFIleListRemoved, setMaterialFileListRemoved] = useState<
    string[]
  >([]);

  useEffect(() => {
    const initValue = () => {
      if (!taskGroupSubmission) {
        return;
      }

      setDescription(taskGroupSubmission.description as string);

      const mapUrlToUploadFile = (url: string, idx: number) => ({
        uid: `remote-${idx}-${url}`,
        name: url.split("/").pop() ?? `file-${idx}`,
        status: "done" as const,
        url,
      });

      if (taskGroupSubmission.images.length) {
        const files = taskGroupSubmission.images.map(mapUrlToUploadFile);
        setImageFileList(files);
        form.setFieldsValue({ images: files });
      }

      if (taskGroupSubmission.videos.length) {
        const files = taskGroupSubmission.videos.map(mapUrlToUploadFile);
        setVideoFileList(files);
        form.setFieldsValue({ videos: files });
      }

      if (taskGroupSubmission.materials.length) {
        const files = taskGroupSubmission.materials.map(mapUrlToUploadFile);
        setMaterialFileList(files);
        form.setFieldsValue({ materials: files });
      }

      form.setFieldsValue({
        title: taskGroupSubmission.title ?? "",
      });
    };
    initValue();
  }, [taskGroupSubmission, form]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onChangeImage: UploadProps["onChange"] = ({
    file,
    fileList: newFileList,
  }) => {
    if (file.status === "removed" && file.url) {
      const url = file.url;
      setImageFileListRemoved((prev) => [...prev, url]);
      return;
    }

    setImageFileList(newFileList);
    form.setFieldsValue({ images: newFileList });
  };

  const onChangeVideo: UploadProps["onChange"] = ({
    file,
    fileList: newFileList,
  }) => {
    if (file.status === "removed" && file.url) {
      const url = file.url;
      setVideoFileListRemoved((prev) => [...prev, url]);
      return;
    }

    setVideoFileList(newFileList);
    form.setFieldsValue({ videos: newFileList });
  };

  const onChangeMaterial: UploadProps["onChange"] = ({
    file,
    fileList: newFileList,
  }) => {
    if (file.status === "removed" && file.url) {
      const url = file.url;
      setMaterialFileListRemoved((prev) => [...prev, url]);
      return;
    }

    setMaterialFileList(newFileList);
    form.setFieldsValue({ materials: newFileList });
  };

  const onPreviewImage = async (file: UploadFile) => {
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

  const onPreviewVideo = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
      <html>
        <body style="margin:0; background:#000;">
          <video src="${src}" controls autoplay style="width:100%; height:100%;"></video>
        </body>
      </html>
    `);
    }
  };

  const onPreviewMaterial = async (file: UploadFile) => {
    let src = file.url as string;

    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }

    const ext = file.name?.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
        <iframe src="${src}" style="width:100%; height:100%; border:none;"></iframe>
      `);
      }
      return;
    }

    if (ext === "doc" || ext === "docx") {
      const link = document.createElement("a");
      link.href = src;
      link.download = file.name;
      link.click();
      return;
    }

    window.open(src);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setIsButtonLoading(true);

    try {
      const fd = new FormData();

      fd.append("title", values.title ?? "");
      fd.append("description", description);
      fd.append("status", "active");
      fd.append("userId", userId);
      fd.append("taskGroupId", taskGroup._id);

      const processFiles = (
        files: (UploadFile | undefined)[] | undefined
      ): {
        newFiles: File[];
        existingUrls: string[];
      } => {
        const newFiles: File[] = [];
        const existingUrls: string[] = [];

        const list = files ?? [];
        for (const f of list) {
          if (!f) continue;
          const anyF = f as any;
          if (anyF.originFileObj) {
            newFiles.push(anyF.originFileObj as File);
          } else if (anyF.originFile) {
            newFiles.push(anyF.originFile as File);
          } else if (anyF.url) {
            existingUrls.push(anyF.url as string);
          } else if (anyF.response?.url) {
            existingUrls.push(anyF.response.url as string);
          }
        }

        return { newFiles, existingUrls };
      };

      const imageList =
        (values.images as UploadFile[] | undefined) ?? imageFileList;
      const { newFiles: newImages, existingUrls: existingImages } =
        processFiles(imageList);
      for (const file of newImages) {
        fd.append("images", file);
      }
      if (existingImages.length > 0) {
        fd.append("existingImages", JSON.stringify(existingImages));
      }

      const videoList =
        (values.videos as UploadFile[] | undefined) ?? videoFileList;
      const { newFiles: newVideos, existingUrls: existingVideos } =
        processFiles(videoList);
      for (const file of newVideos) {
        fd.append("videos", file);
      }
      if (existingVideos.length > 0) {
        fd.append("existingVideos", JSON.stringify(existingVideos));
      }

      const materialList =
        (values.materials as UploadFile[] | undefined) ?? materialFileList;
      const { newFiles: newMaterials, existingUrls: existingMaterials } =
        processFiles(materialList);
      for (const file of newMaterials) {
        fd.append("materials", file);
      }
      if (existingMaterials.length > 0) {
        fd.append("existingMaterials", JSON.stringify(existingMaterials));
      }

      fd.append("imagesRemoved", JSON.stringify(imageFileListRemoved));
      fd.append("videosRemoved", JSON.stringify(videoFileListRemoved));
      fd.append("materialsRemoved", JSON.stringify(materialFIleListRemoved));

      const url = `${v1}/taskGroupSubmissions/submit`;
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
      toast.success("Submit successfully.");
      setIsModalOpen(false);

      setImageFileList([]);
      setVideoFileList([]);
      setMaterialFileList([]);
      setReload((prev) => !prev);
      form.resetFields();
    } catch (err) {
      console.error("onFinish error:", err);
      toast.error("Something went wrong.");
    }

    setIsButtonLoading(false);
  };

  const normFile = (e: any) => {
    if (!e) return [];
    if (Array.isArray(e)) return e;
    return e.fileList;
  };

  return (
    <>
      <Modal
        title="Submit my answer"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
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

          <BoxTinyMCE
            label="Description"
            initialValue={description}
            setValue={setDescription}
          />
          <br />

          <Form.Item
            name="images"
            label="Images"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              fileList={imageFileList}
              onChange={onChangeImage}
              onPreview={onPreviewImage}
              beforeUpload={() => false}
              maxCount={6}
              accept="image/*"
            >
              {imageFileList.length < 6 && "+ Upload"}
            </Upload>
          </Form.Item>

          <Form.Item
            name="videos"
            label="Videos"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              fileList={videoFileList}
              onChange={onChangeVideo}
              onPreview={onPreviewVideo}
              beforeUpload={() => false}
              maxCount={6}
              accept="video/mp4"
            >
              {videoFileList.length < 6 && "+ Upload"}
            </Upload>
          </Form.Item>

          <Form.Item
            name="materials"
            label="Materials"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              fileList={materialFileList}
              onChange={onChangeMaterial}
              onPreview={onPreviewMaterial}
              beforeUpload={() => false}
              maxCount={6}
              accept=".pdf,.doc,.docx"
            >
              {materialFileList.length < 6 && "+ Upload"}
            </Upload>
          </Form.Item>

          <Form.Item className="flex justify-end" label={null}>
            <Button type="primary" htmlType="submit" loading={isButtonLoading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {taskGroupSubmission ? (
        <Button
          icon={<EditOutlined />}
          color="cyan"
          variant="outlined"
          onClick={showModal}
        >
          Edit
        </Button>
      ) : (
        <Button icon={<UploadOutlined />} onClick={showModal}>
          Submit
        </Button>
      )}
    </>
  );
}

export default GroupProfileTasksButtonSubmit;
