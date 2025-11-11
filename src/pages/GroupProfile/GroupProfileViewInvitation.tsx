import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Card, Button, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCookie } from "@/helpers/cookies";
import { Avatar } from "@/components/ui/avatar";
import {
  findBySlugGroup,
  inviteMemberGroupAccept,
  inviteMemberGroupReject,
} from "@/services/group";
import { Separator } from "@/components/ui/separator";
import type IGroup from "@/interfaces/group.interface";

function GroupProfileViewInvitation() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const navigate = useNavigate();
  const { slug } = useParams() as { slug: string };
  const [loading, setLoading] = useState(false);
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

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (!group) {
        return;
      }
      await inviteMemberGroupAccept({ accessToken, id: group._id, userId });

      toast.success("You have accepted the invitation");

      navigate(`/group-profile/${slug}`);
    } catch {
      toast.error("The invitation has expired.");

      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (!group) {
        return;
      }
      await inviteMemberGroupReject({ accessToken, id: group._id, userId });

      toast.warning("You have rejcted the invitation");

      navigate("/");
    } catch {
      toast.error("The invitation has expired.");

      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {group && (
          <Card
            style={{
              width: 420,
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
            cover={
              <img
                alt="Group Cover"
                src={group.coverPhoto}
                style={{ height: 180, objectFit: "cover" }}
              />
            }
          >
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 border-4 border-white -mt-12">
                <img
                  src={group.avatar}
                  alt={group.title}
                  className="rounded-full w-full h-full object-cover"
                />
              </Avatar>

              <h2 className="text-xl font-semibold mt-3">{group.title}</h2>
              <p className="text-gray-600 text-sm">{group.description}</p>

              <Separator className="my-4" />

              <div className="flex gap-3">
                <Button
                  danger
                  size="large"
                  onClick={handleReject}
                  loading={loading}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleAccept}
                  loading={loading}
                >
                  Chấp nhận
                </Button>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
}

export default GroupProfileViewInvitation;
