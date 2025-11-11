import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Col, Row, Tabs, type TabsProps } from "antd";

import { getCookie } from "@/helpers/cookies";
import { findBySlugGroup } from "@/services/group";
import type IGroup from "@/interfaces/group.interface";

import GroupProfileHeader from "./GroupProfileHeader";
import GroupProfileMembers from "./GroupProfileMembers";
import GroupProfileDescription from "./GroupProfileDescription";

import "./GroupProfile.css";
import GroupProfileSettings from "./GroupProfileSettings";

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
      label: "Tab 1",
      children: "Content of Tab Pane 1",
    },
    {
      key: "2",
      label: "Members",
      children: (
        <>
          {group && (
            <GroupProfileMembers
              accessToken={accessToken}
              group={group}
            />
          )}
        </>
      ),
    },
    {
      key: "3",
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

          {/* Body */}
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
        </div>
      </div>
    </>
  );
}

export default GroupProfilePage;
