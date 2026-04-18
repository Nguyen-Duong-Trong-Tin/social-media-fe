import {
  Avatar,
  Empty,
  Form,
  Input,
  Modal,
  Tooltip,
  Upload,
  type FormProps,
  type GetProp,
  type UploadFile,
  type UploadProps,
} from "antd";
import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";

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
import type { IArticleGroup } from "@/interfaces/articleGroup.interface";
import type { IGroup } from "@/interfaces/group.interface";
import {
  createCommentArticleGroup,
  createArticleGroup,
  deleteCommentArticleGroup,
  deleteArticleGroup,
  toggleLikeArticleGroup,
  updateArticleGroup,
} from "@/services/articleGroup";
import { userFindUserByIds } from "@/services/user";

import "../Profile/Profile.css";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

type FieldType = {
  title: string;
  images: UploadFile[];
  videos: UploadFile[];
};

type ArticleUserPreview = {
  _id: string;
  fullName: string;
  avatar?: string;
};

const DEFAULT_AVATAR_URL =
  "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg";

interface GroupProfileArticlesProps {
  group?: IGroup;
  articles: IArticleGroup[];
  loading: boolean;
  accessToken: string;
  userId: string;
  onReload: () => void;
}

function GroupProfileArticles({
  group,
  articles,
  loading,
  accessToken,
  userId,
  onReload,
}: GroupProfileArticlesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<IArticleGroup | null>(
    null,
  );
  const [expandedArticles, setExpandedArticles] = useState<
    Record<string, boolean>
  >({});

  const [form] = Form.useForm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imagesFileList, setImagesFileList] = useState<UploadFile[]>([]);
  const [videosFileList, setVideosFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewType, setPreviewType] = useState<"image" | "video">("image");
  const [commentsModalArticleId, setCommentsModalArticleId] = useState<
    string | null
  >(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [isLiking, setIsLiking] = useState<Record<string, boolean>>({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});
  const [isDeletingComment, setIsDeletingComment] = useState<
    Record<string, boolean>
  >({});
  const [userPreviewById, setUserPreviewById] = useState<
    Record<string, ArticleUserPreview>
  >({});

  const modalTitle = useMemo(
    () => (editingArticle ? "Edit Article" : "Create Article"),
    [editingArticle],
  );

  const canManage = Boolean(
    group?.users?.some((user) => user.userId === userId),
  );

  useEffect(() => {
    const fetchUsersForEngagement = async () => {
      if (!accessToken) return;

      const engagementUserIds = Array.from(
        new Set(
          articles
            .flatMap((article) => [
              ...(article.likes ?? []).map((like) => like.userId),
              ...(article.comments ?? []).map((comment) => comment.userId),
            ])
            .filter(
              (id): id is string =>
                typeof id === "string" && Boolean(id.trim()),
            ),
        ),
      );

      if (!engagementUserIds.length) {
        setUserPreviewById({});
        return;
      }

      try {
        const {
          data: { data },
        } = await userFindUserByIds({
          accessToken,
          ids: engagementUserIds,
        });

        const nextMap: Record<string, ArticleUserPreview> = {};
        (data || []).forEach((user: ArticleUserPreview) => {
          if (!user?._id) return;
          nextMap[user._id] = {
            _id: user._id,
            fullName: user.fullName,
            avatar: user.avatar,
          };
        });

        setUserPreviewById(nextMap);
      } catch {
        // Keep fallback display with userId when lookup fails.
      }
    };

    fetchUsersForEngagement();
  }, [accessToken, articles]);

  const getUserPreview = (id: string) => {
    const userPreview = userPreviewById[id];
    return {
      fullName: userPreview?.fullName || id,
      avatar: userPreview?.avatar || DEFAULT_AVATAR_URL,
    };
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle("");
    setDescription("");
    setImagesFileList([]);
    setVideosFileList([]);
    form.resetFields();
    form.setFieldsValue({ title: "", images: [], videos: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (article: IArticleGroup) => {
    const imageUrls = normalizeMediaList(
      article.images as unknown as string[] | string,
    );
    const videoUrls = normalizeMediaList(
      article.videos as unknown as string[] | string,
    );
    const nextImages = toUploadFileList(imageUrls, "image");
    const nextVideos = toUploadFileList(videoUrls, "video");

    setEditingArticle(article);
    setTitle(article.title);
    setDescription(article.description);
    setImagesFileList(nextImages);
    setVideosFileList(nextVideos);
    form.setFieldsValue({
      title: article.title,
      images: nextImages,
      videos: nextVideos,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openPreview = (type: "image" | "video", src: string) => {
    setPreviewType(type);
    setPreviewSrc(src);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewSrc("");
  };

  const openCommentsModal = (articleId: string) => {
    setCommentsModalArticleId(articleId);
  };

  const closeCommentsModal = () => {
    setCommentsModalArticleId(null);
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
    fileWindow?.document.write(
      `<iframe src="${src}" style="width:100%;height:100%" />`,
    );
  };

  const normFile = (e?: { fileList?: UploadFile[] } | UploadFile[]) => {
    if (!e) return [];
    return Array.isArray(e) ? e : (e.fileList ?? []);
  };

  const normalizeMediaList = (media?: string[] | string) => {
    if (!media) return [];
    if (Array.isArray(media)) return media;

    const trimmed = media.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // fall through to delimiter split
      }
    }

    return trimmed
      .split(/[,;|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const toUploadFileList = (urls: string[], type: "image" | "video") =>
    urls.map((url, index) => ({
      uid: `${type}-${index}-${url}`,
      name: url.split("/").pop() ?? `${type}-${index + 1}`,
      status: "done" as const,
      url,
    }));

  const getExistingUrls = (files: UploadFile[]) =>
    files
      .filter((file) => {
        const hasNewFile = Boolean(
          file.originFileObj ||
          (file as UploadFile & { originFile?: File }).originFile,
        );
        return !hasNewFile && Boolean(file.url);
      })
      .map((file) => String(file.url));

  const handleSave: FormProps<FieldType>["onFinish"] = async () => {
    if (!group?._id) return;

    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("groupId", group._id);
    fd.append("userId", userId);

    if (editingArticle) {
      const existingImages = getExistingUrls(imagesFileList);
      const existingVideos = getExistingUrls(videosFileList);
      fd.append("existingImages", JSON.stringify(existingImages));
      fd.append("existingVideos", JSON.stringify(existingVideos));
    }

    const imagesList = imagesFileList || [];
    for (const file of imagesList) {
      const fileObj =
        file.originFileObj ??
        (file as UploadFile & { originFile?: File }).originFile ??
        undefined;
      if (fileObj) {
        fd.append("images", fileObj);
      }
    }

    const videosList = videosFileList || [];
    for (const file of videosList) {
      const fileObj =
        file.originFileObj ??
        (file as UploadFile & { originFile?: File }).originFile ??
        undefined;
      if (fileObj) {
        fd.append("videos", fileObj);
      }
    }

    try {
      setIsSaving(true);
      if (editingArticle) {
        await updateArticleGroup({
          accessToken,
          id: editingArticle._id,
          payload: fd,
        });
        toast.success("Article updated successfully.");
      } else {
        await createArticleGroup({
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

  const handleDelete = async (article: IArticleGroup) => {
    const confirmed = window.confirm("Delete this article?");
    if (!confirmed) return;

    try {
      await deleteArticleGroup({
        accessToken,
        id: article._id,
        userId,
      });
      toast.success("Article deleted successfully.");
      onReload();
    } catch {
      toast.error("Delete failed. Please try again.");
    }
  };

  const handleToggleLike = async (article: IArticleGroup) => {
    try {
      setIsLiking((prev) => ({ ...prev, [article._id]: true }));
      await toggleLikeArticleGroup({
        accessToken,
        id: article._id,
        userId,
      });
      onReload();
    } catch {
      toast.error("Like failed. Please try again.");
    } finally {
      setIsLiking((prev) => ({ ...prev, [article._id]: false }));
    }
  };

  const handleCommentSubmit = async (article: IArticleGroup) => {
    const content = (commentDrafts[article._id] || "").trim();
    if (!content) {
      toast.error("Please enter a comment.");
      return;
    }

    try {
      setIsCommenting((prev) => ({ ...prev, [article._id]: true }));
      await createCommentArticleGroup({
        accessToken,
        id: article._id,
        userId,
        content,
      });
      setCommentDrafts((prev) => ({ ...prev, [article._id]: "" }));
      onReload();
    } catch {
      toast.error("Comment failed. Please try again.");
    } finally {
      setIsCommenting((prev) => ({ ...prev, [article._id]: false }));
    }
  };

  const handleDeleteComment = async (
    article: IArticleGroup,
    commentId?: string,
  ) => {
    if (!commentId) return;

    try {
      setIsDeletingComment((prev) => ({ ...prev, [commentId]: true }));
      await deleteCommentArticleGroup({
        accessToken,
        id: article._id,
        commentId,
        userId,
      });
      onReload();
    } catch {
      toast.error("Delete comment failed. Please try again.");
    } finally {
      setIsDeletingComment((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const renderMedia = (article: IArticleGroup) => {
    const images = normalizeMediaList(
      article.images as unknown as string[] | string,
    );
    const videos = normalizeMediaList(
      article.videos as unknown as string[] | string,
    );
    const hasMedia = images.length > 0 || videos.length > 0;

    if (!hasMedia) {
      return <div className="profile-article-placeholder">No media</div>;
    }

    return (
      <div className="profile-article-media-grid">
        {images.map((src, index) => (
          <button
            key={`image-${src}-${index}`}
            type="button"
            className="profile-article-media-button"
            onClick={() => openPreview("image", src)}
            aria-label={`View image ${index + 1}`}
          >
            <span className="profile-article-media-badge" aria-hidden="true">
              IMG
            </span>
            <img
              src={src}
              alt={article.title}
              className="profile-article-media-item"
              loading="lazy"
            />
          </button>
        ))}
        {videos.map((src, index) => (
          <button
            key={`video-${src}-${index}`}
            type="button"
            className="profile-article-media-button"
            onClick={() => openPreview("video", src)}
            aria-label={`View video ${index + 1}`}
          >
            <span className="profile-article-media-badge" aria-hidden="true">
              VID
            </span>
            <video
              className="profile-article-media-item"
              preload="metadata"
              muted
              playsInline
            >
              <source src={src} />
            </video>
          </button>
        ))}
      </div>
    );
  };

  const formatDateTime = (value: Date | string) =>
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  const descriptionMaxLength = 280;

  const stripHtmlTags = (html: string) => {
    const parser = new DOMParser();
    return (
      parser.parseFromString(html, "text/html").body.textContent ?? ""
    ).trim();
  };

  const isDescriptionLong = (html: string) => {
    return stripHtmlTags(html).length > descriptionMaxLength;
  };

  const toggleDescription = (articleId: string) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [articleId]: !prev[articleId],
    }));
  };

  const commentsModalArticle = commentsModalArticleId
    ? (articles.find((article) => article._id === commentsModalArticleId) ??
      null)
    : null;

  return (
    <Card className="profile-card">
      <CardHeader>
        <CardTitle>Articles</CardTitle>
        <CardDescription>
          Articles {group?.title ? `in ${group.title}` : ""}
        </CardDescription>
        {canManage && (
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
            {articles.map((article) => {
              const isLongDescription = isDescriptionLong(article.description);
              const isExpanded = Boolean(expandedArticles[article._id]);
              const likes = article.likes ?? [];
              const comments = article.comments ?? [];
              const hasLiked = likes.some((like) => like.userId === userId);
              const likedUserIds = Array.from(
                new Set(likes.map((like) => like.userId).filter(Boolean)),
              );

              return (
                <article key={article._id} className="profile-article-card">
                  <div className="profile-article-content">
                    <h3>{article.title}</h3>
                    <div className="profile-article-meta">
                      <span>Created: {formatDateTime(article.createdAt)}</span>
                      <span>Updated: {formatDateTime(article.updatedAt)}</span>
                    </div>
                    <div
                      className={`profile-article-description ${
                        isExpanded
                          ? "profile-article-description--expanded"
                          : ""
                      }`}
                      dangerouslySetInnerHTML={{ __html: article.description }}
                    />
                    {isLongDescription && (
                      <button
                        type="button"
                        className="profile-article-description-toggle"
                        onClick={() => toggleDescription(article._id)}
                      >
                        {isExpanded ? "Show less" : "See full description"}
                      </button>
                    )}
                    <div className="profile-article-engagement">
                      <div className="profile-article-engagement-actions">
                        <Tooltip
                          title={
                            likedUserIds.length > 0 ? (
                              <div className="profile-article-liked-users-popover">
                                <div>Liked by:</div>
                                {likedUserIds.map((likedUserId) => (
                                  <div
                                    key={likedUserId}
                                    className="profile-article-liked-user-row"
                                  >
                                    <Avatar
                                      size={24}
                                      src={getUserPreview(likedUserId).avatar}
                                    />
                                    <span>
                                      {getUserPreview(likedUserId).fullName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "No likes yet"
                            )
                          }
                          placement="top"
                        >
                          <Button
                            type="button"
                            variant={hasLiked ? "default" : "outline"}
                            size="sm"
                            disabled={Boolean(isLiking[article._id])}
                            onClick={() => handleToggleLike(article)}
                          >
                            {hasLiked ? "Unlike" : "Like"} ({likes.length})
                          </Button>
                        </Tooltip>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openCommentsModal(article._id)}
                        >
                          Comments ({comments.length})
                        </Button>
                      </div>
                    </div>

                    {article.createdBy?.userId === userId && (
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
                  <div className="profile-article-media">
                    {renderMedia(article)}
                  </div>
                </article>
              );
            })}
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
              <Button variant="outline" type="button">
                Upload videos
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        onCancel={closePreview}
        footer={null}
        title="Preview"
      >
        {previewType === "image" ? (
          <img src={previewSrc} alt="Preview" style={{ width: "100%" }} />
        ) : (
          <video src={previewSrc} controls style={{ width: "100%" }} />
        )}
      </Modal>

      <Modal
        open={Boolean(commentsModalArticle)}
        onCancel={closeCommentsModal}
        footer={null}
        title={
          commentsModalArticle
            ? `Comments - ${commentsModalArticle.title}`
            : "Comments"
        }
      >
        {commentsModalArticle && (
          <div className="profile-article-comments">
            <div className="profile-article-comment-form">
              <Input
                value={commentDrafts[commentsModalArticle._id] ?? ""}
                placeholder="Write a comment..."
                onChange={(e) =>
                  setCommentDrafts((prev) => ({
                    ...prev,
                    [commentsModalArticle._id]: e.target.value,
                  }))
                }
                onPressEnter={() => handleCommentSubmit(commentsModalArticle)}
              />
              <Button
                type="button"
                size="sm"
                disabled={Boolean(isCommenting[commentsModalArticle._id])}
                onClick={() => handleCommentSubmit(commentsModalArticle)}
              >
                Comment
              </Button>
            </div>

            {(commentsModalArticle.comments ?? []).length > 0 ? (
              <div className="profile-article-comment-list">
                {(commentsModalArticle.comments ?? []).map((comment) => {
                  const canDeleteComment = comment.userId === userId;
                  const commentUser = getUserPreview(comment.userId);

                  return (
                    <div
                      key={
                        comment._id || `${comment.userId}-${comment.createdAt}`
                      }
                      className="profile-article-comment-item"
                    >
                      <div className="profile-article-comment-meta">
                        <span className="profile-article-comment-user">
                          <Avatar size={24} src={commentUser.avatar} />
                          <span>{commentUser.fullName}</span>
                        </span>
                        <span>{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <div className="profile-article-comment-content">
                        {comment.content}
                      </div>
                      {canDeleteComment && (
                        <button
                          type="button"
                          className="profile-article-comment-delete"
                          disabled={Boolean(
                            comment._id && isDeletingComment[comment._id],
                          )}
                          onClick={() =>
                            handleDeleteComment(
                              commentsModalArticle,
                              comment._id,
                            )
                          }
                        >
                          Delete comment
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500">No comments yet.</div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}

export default GroupProfileArticles;
