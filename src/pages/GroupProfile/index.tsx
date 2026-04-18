import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Col, Result, Row, Tabs, type TabsProps } from "antd";
import { toast } from "react-toastify";

import { getCookie } from "@/helpers/cookies";
import { findBySlugGroup, requestJoinGroup } from "@/services/group";
import { findArticleGroups } from "@/services/articleGroup";
import ButtonGoBack from "@/components/ButtonGoBack";
import type { IGroup } from "@/interfaces/group.interface";
import type { IArticleGroup } from "@/interfaces/articleGroup.interface";

import GroupProfileHeader from "./GroupProfileHeader";
import GroupProfileMembers from "./GroupProfileMembers";
import GroupProfileSettings from "./GroupProfileSettings";
import GroupProfileDescription from "./GroupProfileDescription";
import GroupProfileArticles from "./GroupProfileArticles";
import GroupProfileChat from "./GroupProfileChat";

import "./GroupProfile.css";
import GroupProfileTasks from "./GroupProfileTasks";
import GroupProfileAIAssistant from "./GroupProfileAIAssistant";

function GroupProfilePage() {
  const { slug } = useParams() as { slug: string };
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const [group, setGroup] = useState<IGroup>();
  const [articleGroups, setArticleGroups] = useState<IArticleGroup[]>([]);
  const [articleGroupsLoading, setArticleGroupsLoading] = useState(false);

  const fetchGroup = useCallback(async () => {
    const {
      data: { data },
    } = await findBySlugGroup({ accessToken, slug });

    setGroup(data);
  }, [accessToken, slug]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const onChange = (key: string) => {
    console.log(key);
  };

  const fetchArticleGroups = useCallback(async () => {
    if (!group?._id) return;

    try {
      setArticleGroupsLoading(true);
      const {
        data: {
          data: { articleGroups: responseArticleGroups },
        },
      } = await findArticleGroups({
        accessToken,
        filter: { groupId: group._id, status: "active" },
        page: 1,
        limit: 10,
      });

      setArticleGroups(responseArticleGroups.items);
    } catch {
      toast.error("Failed to load group articles.");
    } finally {
      setArticleGroupsLoading(false);
    }
  }, [accessToken, group]);

  useEffect(() => {
    if (!group) return;
    fetchArticleGroups();
  }, [fetchArticleGroups, group]);

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Tasks",
      children: <>{group && <GroupProfileTasks group={group} />}</>,
    },
    {
      key: "3",
      label: "Articles",
      children: (
        <>
          <GroupProfileArticles
            group={group}
            articles={articleGroups}
            loading={articleGroupsLoading}
            accessToken={accessToken}
            userId={userId}
            onReload={fetchArticleGroups}
          />
        </>
      ),
    },
    {
      key: "4",
      label: "Members",
      children: (
        <>
          {group && (
            <GroupProfileMembers
              accessToken={accessToken}
              group={group}
              onReload={fetchGroup}
            />
          )}
        </>
      ),
    },
    {
      key: "2",
      label: "Chat",
      children: <>{group && <GroupProfileChat group={group} />}</>,
    },
    {
      key: "5",
      label: "AI Assistant",
      children: (
        <>
          <GroupProfileAIAssistant />
        </>
      ),
    },
    {
      key: "6",
      label: "Settings",
      children: (
        <>
          {group && (
            <GroupProfileSettings
              accessToken={accessToken}
              group={group}
              setGroup={setGroup}
            />
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <div className="group-profile-page">
        <div className="container">
          <GroupProfileHeader group={group} />

          {group && group.users.some((user) => user.userId === userId) ? (
            <Row gutter={[20, 0]}>
              <Col span={8}>
                <GroupProfileDescription
                  accessToken={accessToken}
                  group={group}
                  setGroup={setGroup}
                  userId={userId}
                />
              </Col>
              <Col span={16}>
                <Tabs
                  defaultActiveKey="1"
                  size="large"
                  items={tabItems}
                  onChange={onChange}
                />
              </Col>
            </Row>
          ) : (
            <div className="flex justify-center mt-20">
              {group && userId && accessToken && (
                <Result
                  status="403"
                  title="This group is private 🔒"
                  subTitle="You cannot view group content because you are not a member."
                  extra={
                    <div className="flex flex-wrap gap-2 justify-center">
                      <ButtonGoBack />
                      <Button
                        type="primary"
                        disabled={group.userRequests?.includes(userId)}
                        onClick={async () => {
                          try {
                            const response = await requestJoinGroup({
                              accessToken,
                              id: group._id,
                              userId,
                            });
                            setGroup(response.data?.data || group);
                            toast.success("Request sent.");
                          } catch {
                            toast.error("Unable to send request.");
                          }
                        }}
                      >
                        {group.userRequests?.includes(userId)
                          ? "Request sent"
                          : "Request to join"}
                      </Button>
                    </div>
                  }
                />
              )}
              {!group && (
                <Result
                  status="403"
                  title="This group is private 🔒"
                  subTitle="You cannot view group content because you are not a member."
                  extra={<ButtonGoBack />}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default GroupProfilePage;
