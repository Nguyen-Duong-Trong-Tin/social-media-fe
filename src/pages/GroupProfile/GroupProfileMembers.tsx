import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Card, Image, Input, Modal, Select, Table, Tag } from "antd";

import { Button } from "@/components/ui/button";
import type IUser from "@/interfaces/user.interface";
import { findUsers, userFindUserByIds } from "@/services/user";
import { changeUserRole, inviteMemberGroup } from "@/services/group";
import { toast } from "react-toastify";
import type IGroup from "@/interfaces/group.interface";
import { getCookie } from "@/helpers/cookies";
import { EGroupRole } from "@/enums/group.enum";

const { Search } = Input;

function GroupProfileMembers({
  accessToken,
  group,
}: {
  accessToken: string;
  group: IGroup;
}) {
  const navigate = useNavigate();
  const userId = getCookie("userId");

  const columns = [
    {
      title: "Full name",
      dataIndex: "fullName",
      key: "fullName",
      render: (
        _: unknown,
        {
          avatar,
          fullName,
          slug,
        }: { avatar: string; fullName: string; slug: string }
      ) => (
        <>
          <div
            className="flex items-center cursor-pointer w-fit"
            onClick={() => navigate(`/profile/${slug}`)}
          >
            <Avatar
              src={
                avatar
                  ? avatar
                  : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
              }
              size={64}
            />
            <div className="ms-2">{fullName}</div>
          </div>
        </>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "groupRole",
      key: "groupRole",
      render: (
        _: unknown,
        { groupRole, groupUserId }: { groupRole: string; groupUserId: string }
      ) => {
        if (
          groupUserId !== userId &&
          groupRole !== "superAdmin" &&
          group.users.some(
            (user) =>
              user.userId === userId &&
              (user.role === "superAdmin" || user.role === "admin")
          )
        ) {
          const onChange = async (value: string) => {
            try {
              await changeUserRole({
                accessToken,
                id: group._id,
                userId: groupUserId,
                role: value,
              });

              toast.success("Update successfully.");
            } catch {
              toast.error("Something went wrong.");
            }
          };

          return (
            <Select
              onChange={onChange}
              defaultValue={groupRole}
              options={Object.values(EGroupRole).map((role) => {
                const content =
                  role === "superAdmin"
                    ? "Owner"
                    : role === "teacher"
                    ? "Teacher"
                    : role === "admin"
                    ? "Admin"
                    : "Member";

                return {
                  value: role,
                  label: <span>{content}</span>,
                };
              })}
            />
          );
        }

        const content =
          groupRole === "superAdmin"
            ? "Owner"
            : groupRole === "teacher"
            ? "Teacher"
            : groupRole === "admin"
            ? "Admin"
            : "Member";

        const color =
          groupRole === "superAdmin"
            ? "red"
            : groupRole === "teacher"
            ? "green"
            : "blue";

        return <Tag color={color}>{content}</Tag>;
      },
    },
  ];

  const [isModalInviteMemberOpen, setIsModalInviteMemberOpen] = useState(false);
  const [searchGroupUsersByName, setSearchGroupUsersByName] = useState("");
  const [users, setUsers] = useState<(IUser & { groupRole: string })[]>([]);
  const [searchUsersCanInvite, setSearchUsersCanInvite] = useState("");
  const [usersCanInviteTotal, setUsersCanInviteTotal] = useState(0);
  const [usersCanInviteLimit, setUsersCanInviteLimit] = useState(20);
  const [usersCanInvite, setUsersCanInvite] = useState<IUser[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchApi = async () => {
      const {
        data: { data },
      } = await userFindUserByIds({
        accessToken,
        ids: group.users.map((groupUser) => groupUser.userId),
      });

      setUsers(
        data.map((item: IUser, index: number) => ({
          ...item,
          groupRole: group.users[index].role,
          groupUserId: group.users[index].userId,
        }))
      );
    };
    fetchApi();
  }, [accessToken, group.users]);

  useEffect(() => {
    const fetchApi = async () => {
      const {
        data: { data },
      } = await findUsers({
        accessToken,
        page: 1,
        limit: usersCanInviteLimit,
        filter: {
          fullName: searchUsersCanInvite,
          notInIds: JSON.stringify([
            ...users.map((user) => user._id),
            group.usersInvited.map((userInvited) => userInvited),
          ]),
        },
      });

      setUsersCanInvite(data.users.items);
      setUsersCanInviteTotal(data.users.total);
    };
    fetchApi();
  }, [
    accessToken,
    users,
    usersCanInviteLimit,
    searchUsersCanInvite,
    group.usersInvited,
  ]);

  const handleInviteMember = async ({
    userId,
    groupId,
  }: {
    userId: string;
    groupId: string;
  }) => {
    try {
      await inviteMemberGroup({ accessToken, id: groupId, userId });

      setInvitedUsers((prev) => [...prev, userId]);
      toast.success("Invite successfully.");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const showModalInviteMember = () => {
    setIsModalInviteMemberOpen(true);
  };

  const handleInviteMemberOk = () => {
    setIsModalInviteMemberOpen(false);
  };

  const handleInviteMemberCancel = () => {
    setIsModalInviteMemberOpen(false);
  };

  const handleViewMoreUsersCanInvite = () => {
    setUsersCanInviteLimit(usersCanInviteLimit + 20);
  };

  const groupUsersFiltered = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchGroupUsersByName.toLowerCase())
  );

  const canInviteMember = group.users.some(
    (user) =>
      user.userId === userId &&
      (user.role === "superAdmin" ||
        user.role === "admin" ||
        user.role === "teacher")
  );

  return (
    <>
      <Modal
        title="Invite members"
        closable={{ "aria-label": "Custom Close Button" }}
        width={"fit-content"}
        open={isModalInviteMemberOpen}
        onOk={handleInviteMemberOk}
        onCancel={handleInviteMemberCancel}
      >
        <Search
          placeholder={"Search users..."}
          value={searchUsersCanInvite}
          onChange={(e) => {
            setSearchUsersCanInvite(e.target.value);
          }}
          allowClear
          enterButton={false}
          size="large"
          style={{ borderRadius: 9999, marginBottom: 10 }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersCanInvite.map((user) => (
            <Card
              key={user._id}
              className="shadow-sm rounded-xl hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={
                    user.avatar
                      ? user.avatar
                      : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
                  }
                  alt={user.fullName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                  preview={false}
                />
                <div>
                  <p className="font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                {invitedUsers.includes(user._id) ? (
                  <Button
                    className="cursor-not-allowed"
                    variant="default"
                    onClick={() => {}}
                  >
                    Invited
                  </Button>
                ) : (
                  <Button
                    className="cursor-pointer"
                    variant="default"
                    onClick={() => {
                      handleInviteMember({
                        userId: user._id,
                        groupId: group._id,
                      });
                    }}
                  >
                    Invite
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {usersCanInviteLimit < usersCanInviteTotal && (
          <div className="flex justify-end">
            <Button
              className="cursor-pointer"
              onClick={handleViewMoreUsersCanInvite}
            >
              View more...
            </Button>
          </div>
        )}
      </Modal>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">List Of Group Members</h2>
          <div className="w-1/3">
            <Search
              placeholder={"Search members..."}
              value={searchGroupUsersByName}
              onChange={(e) => {
                setSearchGroupUsersByName(e.target.value);
              }}
              allowClear
              enterButton={false}
              size="large"
              style={{ borderRadius: 9999 }}
            />
          </div>
        </div>

        {canInviteMember && (
          <div className="mb-6 flex justify-end">
            <Button
              className="cursor-pointer"
              variant="default"
              onClick={() => {
                showModalInviteMember();
              }}
            >
              Invite members
            </Button>
          </div>
        )}

        <Table dataSource={groupUsersFiltered} columns={columns} />
      </Card>
    </>
  );
}

export default GroupProfileMembers;
