import { Col, Modal, Row } from "antd";
import { toast } from "react-toastify";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getCookie } from "@/helpers/cookies";
import BoxTinyMCE from "@/components/boxTinyMCE";
import { Button } from "@/components/ui/button";
import { socket } from "@/services/socket";
import type IUser from "@/interfaces/user.interface";
import type IGroup from "@/interfaces/group.interface";
import type IArticleUser from "@/interfaces/articleUser.interface";
import SocketEvent from "@/enums/socketEvent.enum";
import type {
  ServerResponseAcceptFriendRequest,
  ServerResponseDeleteFriend,
  ServerResponseDeleteFriendAccept,
  ServerResponseRejectFriendRequest,
  ServerResponseSendFriendRequest,
} from "@/dtos/dtos/user.dto";

import { findGroups } from "@/services/group";
import { findArticleUsers } from "@/services/articleUser";
import {
  userFindUserByIds,
  findUserById,
  userFindUserBySlug,
  userUpdateBio,
} from "../../services/user";

import ProfileHeader from "./ProfileHeader";
import IntroCard from "./IntroCard";
import StatsCard from "./StatsCard";
import GroupsSection from "./GroupsSection";
import FriendsSection from "./FriendsSection";
import ArticleUsersSection from "./ArticleUsersSection";

import "./Profile.css";

function Profile() {
  const { slug } = useParams();
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  const [user, setUser] = useState<IUser>();
  const [viewer, setViewer] = useState<IUser>();
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingViewer, setIsLoadingViewer] = useState(false);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [articleUsers, setArticleUsers] = useState<IArticleUser[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [articleUsersLoading, setArticleUsersLoading] = useState(false);

  const [bio, setBio] = useState("");
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [profileReload, setProfileReload] = useState(false);

  const showBioModal = () => {
    setIsBioModalOpen(true);
  };

  const handleBioOk = async () => {
    if (user) {
      try {
        const response = await userUpdateBio({
          accessToken,
          id: user._id,
          bio,
        });

        if (response.status === 200) {
          setUser({ ...user, bio: response.data.data.bio });

          toast.success("Update successfully.");
        }
      } catch {
        toast.error("Update failed. Plase try again.");
      }
    }

    setIsBioModalOpen(false);
  };

  const handleBioCancel = () => {
    if (user) {
      setBio(user.bio ?? "");
    }

    setIsBioModalOpen(false);
  };

  useEffect(() => {
    const fetchApi = async () => {
      try {
        setIsLoadingUser(true);

        const {
          data: { data },
        } = await userFindUserBySlug({ accessToken, slug: slug as string });

        setUser(data);
        setBio(data.bio ?? "");
      } catch {
        toast.error("Failed to load profile.");
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchApi();
  }, [accessToken, slug]);

  useEffect(() => {
    const fetchViewer = async () => {
      if (!userId) return;

      try {
        setIsLoadingViewer(true);
        const {
          data: { data },
        } = await findUserById({ accessToken, id: userId });

        setViewer(data);
      } catch {
        toast.error("Failed to load your profile.");
      } finally {
        setIsLoadingViewer(false);
      }
    };

    fetchViewer();
  }, [accessToken, userId, profileReload]);

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    try {
      setGroupsLoading(true);
      const {
        data: {
          data: { groups },
        },
      } = await findGroups({
        accessToken,
        filter: { userId: user._id },
        page: 1,
        limit: 20,
      });

      setGroups(groups.items);
    } catch {
      toast.error("Failed to load groups.");
    } finally {
      setGroupsLoading(false);
    }
  }, [accessToken, user]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      setFriendsLoading(true);
      const friendIds = user.friends?.map((friend) => friend.userId) ?? [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const {
        data: { data },
      } = await userFindUserByIds({ accessToken, ids: friendIds });

      setFriends(data);
    } catch {
      toast.error("Failed to load friends.");
    } finally {
      setFriendsLoading(false);
    }
  }, [accessToken, user]);

  const fetchArticleUsers = useCallback(async () => {
    if (!user) return;

    try {
      setArticleUsersLoading(true);
      const {
        data: {
          data: { articleUsers },
        },
      } = await findArticleUsers({
        accessToken,
        filter: { userId: user._id, status: "active" },
        page: 1,
        limit: 10,
      });

      setArticleUsers(articleUsers.items);
    } catch {
      toast.error("Failed to load articles.");
    } finally {
      setArticleUsersLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    if (!user) return;

    fetchGroups();
    fetchFriends();
    fetchArticleUsers();
  }, [fetchArticleUsers, fetchFriends, fetchGroups, user]);

  useEffect(() => {
    const handler = (
      data:
        | ServerResponseSendFriendRequest
        | ServerResponseAcceptFriendRequest
        | ServerResponseRejectFriendRequest
        | ServerResponseDeleteFriendAccept
        | ServerResponseDeleteFriend
    ) => {
      if (!(userId === data.userId || userId === data.userRequestId)) {
        return;
      }

      setProfileReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_SEND_FRIEND_REQUEST, handler);
    socket.on(SocketEvent.SERVER_RESPONSE_ACCEPT_FRIEND_REQUEST, handler);
    socket.on(SocketEvent.SERVER_RESPONSE_REJECT_FRIEND_REQUEST, handler);
    socket.on(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND_ACCEPT, handler);
    socket.on(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_SEND_FRIEND_REQUEST, handler);
      socket.off(SocketEvent.SERVER_RESPONSE_ACCEPT_FRIEND_REQUEST, handler);
      socket.off(SocketEvent.SERVER_RESPONSE_REJECT_FRIEND_REQUEST, handler);
      socket.off(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND_ACCEPT, handler);
      socket.off(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND, handler);
    };
  }, [userId]);

  const isMyProfile = user?._id === userId;
  const friendsCount = user?.friends?.length ?? 0;

  const relationship = useMemo(() => {
    if (!viewer || !user) {
      return {
        isFriend: false,
        hasSentInvitation: false,
        hasReceivedInvitation: false,
      };
    }

    const isFriend = viewer.friends?.some(
      (friend) => friend.userId === user._id
    );

    return {
      isFriend,
      hasSentInvitation: viewer.friendAccepts?.includes(user._id),
      hasReceivedInvitation: viewer.friendRequests?.includes(user._id),
    };
  }, [viewer, user]);

  const handleSendFriendRequest = () => {
    if (!userId || !user?._id) return;

    socket.emit(SocketEvent.CLIENT_SEND_FRIEND_REQUEST, {
      userId,
      userRequestId: user._id,
    });

    toast.success("Sent invitation successfully");
  };

  const handleCancelInvitation = () => {
    if (!userId || !user?._id) return;

    socket.emit(SocketEvent.CLIENT_DELETE_FRIEND_ACCEPT, {
      userId,
      userRequestId: user._id,
    });

    toast.success("Cancelled invitation successfully");
  };

  const handleAcceptFriendRequest = () => {
    if (!userId || !user?._id) return;

    socket.emit(SocketEvent.CLIENT_ACCEPT_FRIEND_REQUEST, {
      userId,
      userRequestId: user._id,
    });

    toast.success("Accepted friend request successfully");
  };

  const handleRejectFriendRequest = () => {
    if (!userId || !user?._id) return;

    socket.emit(SocketEvent.CLIENT_REJECT_FRIEND_REQUEST, {
      userId,
      userRequestId: user._id,
    });

    toast.success("Rejected friend request successfully");
  };

  const handleDeleteFriend = () => {
    if (!userId || !user?._id) return;

    socket.emit(SocketEvent.CLIENT_DELETE_FRIEND, {
      userId,
      userRequestId: user._id,
    });

    toast.success("Deleted friend successfully");
  };

  const profileActions = useMemo(() => {
    if (isMyProfile || !user || isLoadingViewer) {
      return null;
    }

    if (relationship.isFriend) {
      return (
        <Button variant="secondary" onClick={handleDeleteFriend}>
          Delete friend
        </Button>
      );
    }

    if (relationship.hasSentInvitation) {
      return (
        <Button variant="secondary" onClick={handleCancelInvitation}>
          Cancel invitation
        </Button>
      );
    }

    if (relationship.hasReceivedInvitation) {
      return (
        <>
          <Button onClick={handleAcceptFriendRequest}>Accept</Button>
          <Button variant="secondary" onClick={handleRejectFriendRequest}>
            Reject
          </Button>
        </>
      );
    }

    return <Button onClick={handleSendFriendRequest}>Send invitation</Button>;
  }, [
    handleAcceptFriendRequest,
    handleCancelInvitation,
    handleDeleteFriend,
    handleRejectFriendRequest,
    handleSendFriendRequest,
    isLoadingViewer,
    isMyProfile,
    relationship.hasReceivedInvitation,
    relationship.hasSentInvitation,
    relationship.isFriend,
    user,
  ]);

  return (
    <>
      <div className="profile-page">
        <div className="container">
          <ProfileHeader user={user} actions={profileActions} />

          {/* Body */}
          <Row gutter={[24, 24]} className="profile-body">
            <Modal
              title="Edit Bio"
              closable={{ "aria-label": "Custom Close Button" }}
              open={isBioModalOpen}
              onOk={handleBioOk}
              onCancel={handleBioCancel}
            >
              <BoxTinyMCE label="Bio" initialValue={bio} setValue={setBio} />
            </Modal>

            <Col span={8}>
              <IntroCard
                user={user}
                bio={bio}
                isMyProfile={isMyProfile}
                onEdit={showBioModal}
              />
              <StatsCard groupsCount={groups.length} friendsCount={friendsCount} />
            </Col>
            <Col span={16}>
              <GroupsSection
                user={user}
                groups={groups}
                loading={isLoadingUser || groupsLoading}
              />
              <ArticleUsersSection
                user={user}
                articles={articleUsers}
                loading={isLoadingUser || articleUsersLoading}
                isMyProfile={isMyProfile}
                accessToken={accessToken}
                onReload={fetchArticleUsers}
              />
              <FriendsSection
                user={user}
                friends={friends}
                loading={isLoadingUser || friendsLoading}
              />
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default Profile;
