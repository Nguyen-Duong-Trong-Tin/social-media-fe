import {
  Card,
  Typography,
  Row,
  Col,
  Image,
  Modal,
  List,
  Button,
  Space,
  Divider,
  Tooltip,
  Tag,
  Avatar,
  InputNumber,
  Form,
  type FormProps,
  Result,
} from "antd";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FilePdfOutlined,
  FileWordOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  FileOutlined,
} from "@ant-design/icons";
import {
  findTaskGroupSubmissionBySlug,
  scoringTaskGroupSubmission,
} from "@/services/taskGroupSubmission";
import { formatDate } from "@/helpers/date";
import { getCookie } from "@/helpers/cookies";
import { findUserById } from "@/services/user";
import { findByIdGroup } from "@/services/group";
import BoxTinyMCE from "@/components/boxTinyMCE";
import { IMAGE_NOT_FOUND_SRC } from "@/constants";
import ButtonGoBack from "@/components/ButtonGoBack";
import type IUser from "@/interfaces/user.interface";
import type IGroup from "@/interfaces/group.interface";
import { findTaskGroupById } from "@/services/taskGroup";
import VideoWithPreview from "@/components/VideoWithPreview";
import type ITaskGroup from "@/interfaces/taskGroup.interface";
import type ITaskGroupSubmission from "@/interfaces/taskGroupSubmission.interface";

const { Title, Text } = Typography;

type UploadFileLite = {
  uid: string;
  name?: string;
  url?: string;
};
type FieldType = {
  score: number;
};

const mapUrlToUploadFile = (url: string, idx: number): UploadFileLite => {
  return {
    uid: `remote-${idx}-${url}`,
    name: url.split("/").pop() ?? `file-${idx}`,
    url,
  };
};

function GroupProfileTasksScoringDetail() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const naviagate = useNavigate();
  const { taskGroupSubmissionSlug } = useParams();

  const [reload, setReload] = useState(false);
  const [group, setGroup] = useState<IGroup>();
  const [taskGroup, setTaskGroup] = useState<ITaskGroup>();
  const [taskGroupSubmission, setTaskGroupSubmission] = useState<
    ITaskGroupSubmission | undefined
  >();
  const [user, setUser] = useState<IUser>();
  const [images, setImages] = useState<UploadFileLite[]>([]);
  const [videos, setVideos] = useState<UploadFileLite[]>([]);
  const [materials, setMaterials] = useState<UploadFileLite[]>([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [userScored, setUserScored] = useState<IUser>();

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const responseTaskGroupSubmission = await findTaskGroupSubmissionBySlug(
          {
            accessToken,
            slug: taskGroupSubmissionSlug as string,
          }
        );

        const taskGroupId = responseTaskGroupSubmission.data.data.taskGroupId;
        const responseTaskGroup = await findTaskGroupById({
          accessToken,
          id: taskGroupId,
        });

        const groupId = responseTaskGroup.data.data.groupId;
        const responseGroup = await findByIdGroup({ accessToken, id: groupId });

        const userId = responseTaskGroup.data.data.createdBy.userId;
        const responseUser = await findUserById({ accessToken, id: userId });

        const userScoredId = responseTaskGroupSubmission.data.data.scoredBy;
        let responseUserScored;
        if (userScoredId) {
          responseUserScored = await findUserById({
            accessToken,
            id: userScoredId,
          });
        }

        responseTaskGroup.data.data.images = [
          ...responseTaskGroup.data.data.images,
          ...Array(6 - responseTaskGroup.data.data.images.length).fill(
            IMAGE_NOT_FOUND_SRC
          ),
        ];
        responseTaskGroup.data.data.videos = [
          ...responseTaskGroup.data.data.videos,
          ...Array(6 - responseTaskGroup.data.data.videos.length).fill(""),
        ];

        setTaskGroupSubmission(responseTaskGroupSubmission.data.data);
        setTaskGroup(responseTaskGroup.data.data);
        setGroup(responseGroup.data.data);
        setUser(responseUser.data.data);
        setComment(responseTaskGroupSubmission.data.data.comment);
        setUserScored(responseUserScored?.data.data);
      } catch {
        toast.error("Something went wrong");
      }
    };
    fetchApi();
  }, [accessToken, taskGroupSubmissionSlug, reload]);

  useEffect(() => {
    if (!taskGroupSubmission) return;

    setImages(
      (taskGroupSubmission.images ?? []).map((url: string, idx: number) =>
        mapUrlToUploadFile(url, idx)
      )
    );
    setVideos(
      (taskGroupSubmission.videos ?? []).map((url: string, idx: number) =>
        mapUrlToUploadFile(url, idx)
      )
    );
    setMaterials(
      (taskGroupSubmission.materials ?? []).map((url: string, idx: number) =>
        mapUrlToUploadFile(url, idx)
      )
    );
  }, [taskGroupSubmission, reload]);

  const openVideoModal = (file: UploadFileLite) => {
    setVideoSrc(file.url);
    setVideoModalOpen(true);
  };

  const openInNewTab = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const fileIconForName = (name?: string) => {
    const ext = name?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FilePdfOutlined />;
    if (ext === "doc" || ext === "docx") return <FileWordOutlined />;
    return <FileOutlined />;
  };

  const navigateToProfile = ({ userSlug }: { userSlug: string }) => {
    naviagate(`/profile/${userSlug}`);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const { score } = values;

    try {
      if (!taskGroupSubmission) {
        return;
      }

      await scoringTaskGroupSubmission({
        accessToken,
        id: taskGroupSubmission._id,
        score,
        comment,
        scoredBy: userId,
        scoredAt: new Date(),
      });

      setReload(!reload);
      toast.success("Scoring successfully");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const isMyTaskGroupSubmission = taskGroupSubmission
    ? taskGroupSubmission.createdBy.userId === userId
    : false;

  const isPermission =
    taskGroup && taskGroupSubmission && group
      ? taskGroup.createdBy.userId === userId ||
        taskGroupSubmission.createdBy.userId === userId ||
        group.users.some(
          (user) =>
            (user.role === "superAdmin" || user.role === "admin") &&
            user.userId === userId
        )
      : false;

  return (
    <>
      <ButtonGoBack />
      <br />
      <br />

      <Card className="p-6">
        <Title level={3} className="mb-3">
          Task Group
        </Title>

        {taskGroup && user && (
          <Card>
            <Row gutter={[20, 0]}>
              <Col span={8}>
                <Divider>Images</Divider>
                <Row gutter={[10, 10]}>
                  {taskGroup.images.slice(0, 3).map((image) => (
                    <Col span={8}>
                      <Image
                        src={image}
                        className="w-full aspect-square object-cover"
                        preview={image === IMAGE_NOT_FOUND_SRC ? false : true}
                      />
                    </Col>
                  ))}
                </Row>
                <Row gutter={[10, 10]}>
                  {taskGroup.images.slice(3, 6).map((image) => (
                    <Col span={8}>
                      <Image
                        src={image}
                        className="w-full aspect-square object-cover"
                        preview={image === IMAGE_NOT_FOUND_SRC ? false : true}
                      />
                    </Col>
                  ))}
                </Row>

                <Divider>Videos</Divider>
                <Row gutter={[10, 10]} className="mt-2">
                  {taskGroup.videos.slice(0, 3).map((video) => (
                    <Col span={8}>
                      <VideoWithPreview
                        src={video}
                        thumbnail={
                          video
                            ? ""
                            : "https://img.icons8.com/ios-filled/200/video.png"
                        }
                      />
                    </Col>
                  ))}
                </Row>
                <Row gutter={[10, 10]} className="mt-2">
                  {taskGroup.videos.slice(3, 6).map((video) => (
                    <Col span={8}>
                      <VideoWithPreview
                        src={video}
                        thumbnail={
                          video
                            ? ""
                            : "https://img.icons8.com/ios-filled/200/video.png"
                        }
                      />
                    </Col>
                  ))}
                </Row>
              </Col>
              <Col span={16}>
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-center">
                      <Title level={4}>{taskGroup.title}</Title>

                      <Tag
                        color="#f50"
                        style={{
                          padding: "2px 8px",
                          height: "fit-content",
                        }}
                      >
                        {taskGroup.deadline
                          ? formatDate(taskGroup.deadline)
                          : "No deadline"}
                      </Tag>
                    </div>

                    <Typography>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: taskGroup.description,
                        }}
                        className="prose max-w-none"
                      />
                    </Typography>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div
                      className="flex items-center cursor-pointer w-fit"
                      onClick={() =>
                        navigateToProfile({
                          userSlug: user.slug,
                        })
                      }
                    >
                      <Avatar size={64} src={user.avatar} />
                      <div className="ms-2">
                        <Title level={5}>{user.fullName}</Title>
                        <Text type="secondary">
                          Created at:{" "}
                          {formatDate(taskGroup.createdBy.createdAt)}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </Card>

      <Card className="p-6">
        {!isPermission ? (
          <Result
            status="403"
            title="403"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<ButtonGoBack />}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Title level={3} className="m-0!">
                  {taskGroupSubmission?.title ?? "— No title —"}
                </Title>
                <div className="mt-2">
                  <Text type="secondary">
                    {taskGroupSubmission?.updatedAt
                      ? `Updated at: ${new Date(
                          taskGroupSubmission.updatedAt
                        ).toLocaleString()}`
                      : null}
                  </Text>
                </div>
              </div>

              <div className="ml-auto">
                <Space>
                  <Tooltip title="Images">
                    <PictureOutlined style={{ fontSize: 20 }} />
                  </Tooltip>
                  <Tooltip title="Videos">
                    <PlayCircleOutlined style={{ fontSize: 20 }} />
                  </Tooltip>
                  <Tooltip title="Materials">
                    <FileOutlined style={{ fontSize: 20 }} />
                  </Tooltip>
                </Space>
              </div>
            </div>

            <Divider />

            <section className="mb-6">
              <Text strong>Description</Text>

              <Typography>
                <div
                  dangerouslySetInnerHTML={{
                    __html: taskGroupSubmission?.description ?? "",
                  }}
                  className="prose max-w-none"
                />
              </Typography>
            </section>

            <Divider />

            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Text strong>Images</Text>
                <Text type="secondary">{images.length} file(s)</Text>
              </div>

              {images.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No images provided.
                </div>
              ) : (
                <Image.PreviewGroup>
                  <Row gutter={[12, 12]}>
                    {images.map((file) => (
                      <Col xs={12} sm={8} md={6} lg={4} key={file.uid}>
                        <div className="rounded overflow-hidden shadow-sm bg-white flex justify-center items-center">
                          <Image
                            src={file.url}
                            alt={file.name}
                            style={{
                              width: "100%",
                              height: 140,
                              objectFit: "cover",
                            }}
                            preview={{ src: file.url }}
                            fallback={undefined}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              )}
            </section>

            <Divider />

            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Text strong>Videos</Text>
                <Text type="secondary">{videos.length} file(s)</Text>
              </div>

              {videos.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No videos provided.
                </div>
              ) : (
                <Row gutter={[12, 12]}>
                  {videos.map((file) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={file.uid}>
                      <div className="rounded overflow-hidden shadow-sm bg-black relative">
                        <div
                          className="w-full h-40 flex items-center justify-center cursor-pointer"
                          onClick={() => openVideoModal(file)}
                          style={{ background: "#000" }}
                        >
                          <video
                            src={file.url}
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                            preload="metadata"
                            controls={false}
                          />
                        </div>

                        <div className="p-2 flex items-center justify-between">
                          <Text
                            className="truncate"
                            style={{ maxWidth: "70%" }}
                          >
                            {file.name}
                          </Text>
                          <Space size="small">
                            <Button
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={() => openVideoModal(file)}
                            />
                            <Button
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => openInNewTab(file.url)}
                            />
                          </Space>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </section>

            <Divider />

            <section className="mb-2">
              <div className="flex items-center justify-between mb-3">
                <Text strong>Materials</Text>
                <Text type="secondary">{materials.length} file(s)</Text>
              </div>

              {materials.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No materials provided.
                </div>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={materials}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        <Button
                          key="open"
                          size="small"
                          onClick={() => openInNewTab(file.url)}
                        >
                          Open
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ fontSize: 18 }}>
                            {fileIconForName(file.name)}
                          </div>
                        }
                        title={<Text>{file.name}</Text>}
                        description={<Text type="secondary">{file.url}</Text>}
                      />
                    </List.Item>
                  )}
                />
              )}
            </section>

            <Modal
              open={videoModalOpen}
              onCancel={() => setVideoModalOpen(false)}
              footer={null}
              width="80vw"
              bodyStyle={{ padding: 0, background: "#000" }}
              centered
            >
              {videoSrc ? (
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "70vh", display: "block" }}
                />
              ) : null}
            </Modal>

            <Divider />

            <section className="mb-2">
              <div className="flex justify-between items-center">
                <Text strong>Scoring</Text>
                {userScored && taskGroupSubmission && (
                  <div className="flex justify-between items-center mt-3">
                    <div
                      className="flex items-center cursor-pointer w-fit"
                      onClick={() =>
                        navigateToProfile({
                          userSlug: userScored.slug,
                        })
                      }
                    >
                      <Avatar size={64} src={userScored.avatar} />
                      <div className="ms-2">
                        <Title level={5}>{userScored.fullName}</Title>
                        <Text type="secondary">
                          Scored at: {formatDate(taskGroupSubmission.scoredAt)}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {taskGroupSubmission && (
                <Form name="basic" layout="vertical" onFinish={onFinish}>
                  <Form.Item<FieldType>
                    label="Score"
                    name="score"
                    rules={[
                      { required: true, message: "Please input your score!" },
                    ]}
                    initialValue={
                      taskGroupSubmission.score === -1
                        ? undefined
                        : taskGroupSubmission.score
                    }
                  >
                    <InputNumber
                      min={0}
                      max={10}
                      disabled={isMyTaskGroupSubmission}
                    />
                  </Form.Item>

                  {isMyTaskGroupSubmission ? (
                    <>
                      <Typography>Comment</Typography>

                      <Typography>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: comment,
                          }}
                          className="prose max-w-none"
                        />
                      </Typography>
                    </>
                  ) : (
                    <BoxTinyMCE
                      label="Comment"
                      initialValue={comment}
                      setValue={setComment}
                    />
                  )}
                  <br />

                  {!isMyTaskGroupSubmission && (
                    <Form.Item label={null} className="flex justify-end">
                      <Button type="primary" htmlType="submit">
                        Save
                      </Button>
                    </Form.Item>
                  )}
                </Form>
              )}
            </section>
          </>
        )}
      </Card>
    </>
  );
}

export default GroupProfileTasksScoringDetail;
