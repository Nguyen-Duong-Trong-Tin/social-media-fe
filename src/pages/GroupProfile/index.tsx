import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Col, Result, Row, Tabs, type TabsProps } from "antd";

import { getCookie } from "@/helpers/cookies";
import { findBySlugGroup } from "@/services/group";
import ButtonGoBack from "@/components/ButtonGoBack";
import type IGroup from "@/interfaces/group.interface";

import GroupProfileHeader from "./GroupProfileHeader";
import GroupProfileMembers from "./GroupProfileMembers";
import GroupProfileSettings from "./GroupProfileSettings";
import GroupProfileDescription from "./GroupProfileDescription";

import "./GroupProfile.css";
import GroupProfileTasks from "./GroupProfileTasks";
import GroupProfileAIAssistant from "./GroupProfileAIAssistant";

function GroupProfilePage() {
  const { slug } = useParams() as { slug: string };
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const [group, setGroup] = useState<IGroup>();

  useEffect(() => {
    const fetchApi = async () => {
      const {
        data: { data },
      } = await findBySlugGroup({ accessToken, slug });

      setGroup(data);
    };
    fetchApi();
  }, [accessToken, slug]);

  const onChange = (key: string) => {
    console.log(key);
  };

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Tasks",
      children: (
        <>
          {group && (
            <GroupProfileTasks group={group} />
          )}
        </>
      ),
    },
    {
      key: "2",
      label: "Members",
      children: (
        <>
          {group && (
            <GroupProfileMembers accessToken={accessToken} group={group} />
          )}
        </>
      ),
    },
    {
      key: "3",
      label: "AI Assistant",
      children: (
        <>
          <GroupProfileAIAssistant />
        </>
      ),
    },
    {
      key: "4",
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
              <Result
                status="403"
                title="This group is private 🔒"
                subTitle="You cannot view group content because you are not a member."
                extra={
                  <ButtonGoBack />
                }
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default GroupProfilePage;
