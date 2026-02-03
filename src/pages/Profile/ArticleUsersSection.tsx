import {
  Empty,
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
import { useMemo, useState } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BoxTinyMCE from "@/components/boxTinyMCE";
import type IArticleUser from "@/interfaces/articleUser.interface";
import type IUser from "@/interfaces/user.interface";
import {
  createArticleUser,
  deleteArticleUser,
  updateArticleUser,
} from "@/services/articleUser";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

type FieldType = {
  title: string;
  images: UploadFile[];
  videos: UploadFile[];
};

interface ArticleUsersSectionProps {
  user?: IUser;
  articles: IArticleUser[];
  loading: boolean;
  isMyProfile: boolean;
  accessToken: string;
  onReload: () => void;
}

function ArticleUsersSection({
  user,
  articles,
  loading,
  isMyProfile,
  accessToken,
  onReload,
}: ArticleUsersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<IArticleUser | null>(null);

  const [form] = Form.useForm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imagesFileList, setImagesFileList] = useState<UploadFile[]>([]);
  const [videosFileList, setVideosFileList] = useState<UploadFile[]>([]);

  const modalTitle = useMemo(
    () => (editingArticle ? "Edit Article" : "Create Article"),
    [editingArticle]
  );

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle("");
    setDescription("");
    setImagesFileList([]);
    setVideosFileList([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (article: IArticleUser) => {
    setEditingArticle(article);
    setTitle(article.title);
    setDescription(article.description);
    setImagesFileList([]);
    setVideosFileList([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const onChangeImages: UploadProps["onChange"] = ({ fileList }) => {
    setImagesFileList(fileList);
  };

  const onChangeVideos: UploadProps["onChange"] = ({ fileList }) => {
    setVideosFileList(fileList);
  };

  const onPreviewFile = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const fileWindow = window.open(src);
    fileWindow?.document.write(`<iframe src="${src}" style="width:100%;height:100%" />`);
  };

  const normFile = (e: any) => {
    if (!e) return [];
    return e.fileList;
  };

  const handleSave: FormProps<FieldType>["onFinish"] = async () => {
    if (!user?._id) return;

    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("userId", user._id);

    const imagesList = imagesFileList || [];
    for (const file of imagesList) {
      const fileObj: File | undefined =
        (file as any)?.originFileObj ?? (file as any)?.originFile ?? undefined;
      if (fileObj) {
        fd.append("images", fileObj);
      }
    }

    const videosList = videosFileList || [];
    for (const file of videosList) {
      const fileObj: File | undefined =
        (file as any)?.originFileObj ?? (file as any)?.originFile ?? undefined;
      if (fileObj) {
        fd.append("videos", fileObj);
      }
    }

    try {
      setIsSaving(true);
      if (editingArticle) {
        await updateArticleUser({
          accessToken,
          id: editingArticle._id,
          payload: fd,
        });
        toast.success("Article updated successfully.");
      } else {
        await createArticleUser({
          accessToken,
          payload: fd,
        });
        toast.success("Article created successfully.");
      }

      closeModal();
      onReload();
    } catch {
      toast.error("Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (article: IArticleUser) => {
    if (!user?._id) return;

    const confirmed = window.confirm("Delete this article?");
    if (!confirmed) return;

    try {
      await deleteArticleUser({
        accessToken,
        id: article._id,
        userId: user._id,
      });
      toast.success("Article deleted successfully.");
      onReload();
    } catch {
      toast.error("Delete failed. Please try again.");
    }
  };

  return (
    <Card className="profile-card">
      <CardHeader>
        <CardTitle>Articles</CardTitle>
        <CardDescription>
          Articles {user?.fullName ? `by ${user.fullName}` : ""}
        </CardDescription>
        {isMyProfile && (
          <CardAction>
            <Button variant="outline" onClick={openCreateModal}>
              New Article
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-gray-500">Loading articles...</div>
        ) : articles.length === 0 ? (
          <Empty description="No articles found" />
        ) : (
          <div className="profile-article-grid">
            {articles.map((article) => (
              <article key={article._id} className="profile-article-card">
                <div className="profile-article-media">
                  {article.images?.length ? (
                    <img src={article.images[0]} alt={article.title} />
                  ) : (
                    <div className="profile-article-placeholder">No image</div>
                  )}
                </div>
                <div className="profile-article-content">
                  <h3>{article.title}</h3>
                  <div
                    className="profile-article-description"
                    dangerouslySetInnerHTML={{ __html: article.description }}
                  />
                  {isMyProfile && (
                    <div className="profile-article-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(article)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(article)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={form.submit}
        onCancel={closeModal}
        okButtonProps={{ loading: isSaving }}
      >
        <Form
          form={form}
          layout="vertical"
          method="POST"
          encType="multipart/form-data"
          onFinish={handleSave}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please input the title." }]}
          >
            <Input
              placeholder="Enter article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Item>

          <BoxTinyMCE
            key={editingArticle?._id ?? "new-article"}
            label="Description"
            initialValue={description}
            setValue={setDescription}
          />

          <Form.Item
            name="images"
            label="Images"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              fileList={imagesFileList}
              onChange={onChangeImages}
              onPreview={onPreviewFile}
              beforeUpload={() => false}
              multiple
              accept="image/*"
            >
              {imagesFileList.length < 6 && "+ Upload"}
            </Upload>
          </Form.Item>

          <Form.Item
            name="videos"
            label="Videos"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              fileList={videosFileList}
              onChange={onChangeVideos}
              onPreview={onPreviewFile}
              beforeUpload={() => false}
              multiple
              accept="video/*"
            >
              <Button variant="outline">Upload videos</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default ArticleUsersSection;
