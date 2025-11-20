import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Image,
  Row,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { formatDate } from "@/helpers/date";
import { getCookie } from "@/helpers/cookies";
import { IMAGE_NOT_FOUND_SRC } from "@/constants";
import { userFindUserByIds } from "@/services/user";
import type IUser from "@/interfaces/user.interface";
import { findTaskGroups } from "@/services/taskGroup";
import type IGroup from "@/interfaces/group.interface";
import VideoWithPreview from "@/components/VideoWithPreview";
import type ITaskGroup from "@/interfaces/taskGroup.interface";
import GroupProfileTasksButtonSubmit from "./GroupProfileTasksButtonSubmit";
import type ITaskGroupSubmission from "@/interfaces/taskGroupSubmission.interface";
import { findTaskGroupSubmissionsByUserIdAndTaskGroupIds } from "@/services/taskGroupSubmission";
import GroupProfileTasksButtonCreate from "./GroupProfileTasksButtonCreate";
import { ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function GroupProfileTasks({ group }: { group: IGroup }) {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const navigate = useNavigate();

  const [reload, setReload] = useState(false);
  const [taskGroups, setTaskGroups] = useState<ITaskGroup[]>([]);
  const [taskGroupSubmissions, setTaskGroupSubmissions] = useState<
    ITaskGroupSubmission[]
  >([]);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const fetchApi = async () => {
      if (!group) {
        return;
      }

      const {
        data: {
          data: { taskGroups },
        },
      } = await findTaskGroups({
        accessToken,
        filter: { groupId: group._id },
      });

      const normalizedTaskGroups = taskGroups.items.map((item: ITaskGroup) => {
        const filledImages = [
          ...item.images,
          ...Array(6 - item.images.length).fill(IMAGE_NOT_FOUND_SRC),
        ];

        const filledVideos = [
          ...item.videos,
          ...Array(6 - item.videos.length).fill(""),
        ];

        return {
          ...item,
          images: filledImages,
          videos: filledVideos,
        };
      });

      setTaskGroups(normalizedTaskGroups);
    };

    fetchApi();
  }, [accessToken, group, reload]);

  useEffect(() => {
    const fetchApi = async () => {
      if (!taskGroups.length) {
        return;
      }

      const {
        data: { data },
      } = await userFindUserByIds({
        accessToken,
        ids: taskGroups.map((taskGroup) => taskGroup.createdBy.userId),
      });

      setUsers(data);
    };

    fetchApi();
  }, [accessToken, taskGroups, reload]);

  useEffect(() => {
    const fetchApi = async () => {
      if (!taskGroups.length) {
        return;
      }

      const {
        data: {
          data: { taskGroupSubmissions },
        },
      } = await findTaskGroupSubmissionsByUserIdAndTaskGroupIds({
        accessToken,
        userId,
        taskGroupIds: taskGroups.map((taskGroup) => taskGroup._id),
      });

      setTaskGroupSubmissions(taskGroupSubmissions);
    };
    fetchApi();
  }, [accessToken, group._id, userId, taskGroups, reload]);

  const navigateToProfile = ({ userSlug }: { userSlug: string }) => {
    navigate(`/profile/${userSlug}`);
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center p-3">
          <h2 className="text-2xl font-bold mb-3">List Of Tasks</h2>
          <GroupProfileTasksButtonCreate setReload={setReload} group={group} />
        </div>

        {taskGroups.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No group topics found.
          </div>
        ) : (
          <>
            {taskGroups.length &&
              users.length &&
              taskGroupSubmissions.length &&
              taskGroups.length === users.length &&
              taskGroups.map((taskGroup, index) => (
                <>
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
                                preview={
                                  image === IMAGE_NOT_FOUND_SRC ? false : true
                                }
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
                                preview={
                                  image === IMAGE_NOT_FOUND_SRC ? false : true
                                }
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
                                  userSlug: users[index].slug,
                                })
                              }
                            >
                              <Avatar size={64} src={users[index].avatar} />
                              <div className="ms-2">
                                <Title level={5}>{users[index].fullName}</Title>
                                <Text type="secondary">
                                  Created at:{" "}
                                  {formatDate(taskGroup.createdBy.createdAt)}
                                </Text>
                              </div>
                            </div>

                            {new Date(taskGroup.deadline).getTime() <
                            Date.now() ? (
                              <Button icon={<ClockCircleOutlined />} disabled={true}>
                                Expired
                              </Button>
                            ) : (
                              <GroupProfileTasksButtonSubmit
                                setReload={setReload}
                                taskGroup={taskGroup}
                                taskGroupSubmission={
                                  taskGroupSubmissions[index]
                                }
                              />
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <br />
                </>
              ))}
          </>
        )}
      </Card>
    </>
  );
}

export default GroupProfileTasks;
