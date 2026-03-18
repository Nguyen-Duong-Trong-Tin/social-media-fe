import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Card,
  Image,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  type TableColumnsType,
} from "antd";

import { Button } from "@/components/ui/button";
import type { IUser } from "@/interfaces/user.interface";
import { findUsers, userFindUserByIds } from "@/services/user";
import {
  approveJoinRequestGroup,
  changeUserRole,
  inviteMemberGroup,
  rejectJoinRequestGroup,
} from "@/services/group";
import { toast } from "react-toastify";
import type { IGroup } from "@/interfaces/group.interface";
import { getCookie } from "@/helpers/cookies";
import { EGroupRole } from "@/enums/group.enum";

const { Search } = Input;

function GroupProfileMembers({
  accessToken,
  group,
  onReload,
}: {
  accessToken: string;
  group: IGroup;
  onReload: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const userId = getCookie("userId");

  type GroupUserRecord = IUser & { groupRole: string; groupUserId: string };

  const columns: TableColumnsType<GroupUserRecord> = [
    {
      title: "Full name",
      dataIndex: "fullName",
      key: "fullName",
      render: (_: unknown, { avatar, fullName, slug }: GroupUserRecord) => (
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
      render: (_: unknown, { groupRole, groupUserId }: GroupUserRecord) => {
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
  const [users, setUsers] = useState<GroupUserRecord[]>([]);
  const [searchUsersCanInvite, setSearchUsersCanInvite] = useState("");
  const [usersCanInviteTotal, setUsersCanInviteTotal] = useState(0);
  const [usersCanInviteLimit, setUsersCanInviteLimit] = useState(20);
  const [usersCanInvite, setUsersCanInvite] = useState<IUser[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<IUser[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);

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
    const fetchRequests = async () => {
      if (!group.userRequests || group.userRequests.length === 0) {
        setPendingRequests([]);
        return;
      }

      try {
        setPendingRequestsLoading(true);
        const {
          data: { data },
        } = await userFindUserByIds({
          accessToken,
          ids: group.userRequests,
        });
        setPendingRequests(data || []);
      } catch {
        setPendingRequests([]);
      } finally {
        setPendingRequestsLoading(false);
      }
    };

    fetchRequests();
  }, [accessToken, group.userRequests]);

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

  const handleApproveRequest = async (requestUserId: string) => {
    if (!userId) return;
    try {
      await approveJoinRequestGroup({
        accessToken,
        id: group._id,
        adminId: userId,
        userId: requestUserId,
      });
      toast.success("Request approved.");
      await onReload();
    } catch {
      toast.error("Failed to approve request.");
    }
  };

  const handleRejectRequest = async (requestUserId: string) => {
    if (!userId) return;
    try {
      await rejectJoinRequestGroup({
        accessToken,
        id: group._id,
        adminId: userId,
        userId: requestUserId,
      });
      toast.success("Request rejected.");
      await onReload();
    } catch {
      toast.error("Failed to reject request.");
    }
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

  const canApproveRequests = group.users.some(
    (user) =>
      user.userId === userId &&
      (user.role === "superAdmin" || user.role === "admin")
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

        {canApproveRequests && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Pending requests</h3>
            {pendingRequestsLoading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            {!pendingRequestsLoading && pendingRequests.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No pending requests.
              </div>
            )}
            {!pendingRequestsLoading && pendingRequests.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((requestUser) => (
                  <Card
                    key={requestUser._id}
                    className="shadow-sm rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={
                          requestUser.avatar
                            ? requestUser.avatar
                            : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
                        }
                        alt={requestUser.fullName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        preview={false}
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {requestUser.fullName}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {requestUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(requestUser._id)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleApproveRequest(requestUser._id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <Table dataSource={groupUsersFiltered} columns={columns} />
      </Card>
    </>
  );
}

export default GroupProfileMembers;

