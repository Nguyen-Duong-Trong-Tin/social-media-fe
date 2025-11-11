import { Col, Modal, Row } from "antd";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCookie } from "@/helpers/cookies";
import { Button } from "@/components/ui/button";
import BoxTinyMCE from "@/components/boxTinyMCE";
import type IUser from "@/interfaces/user.interface";

import { userFindUserBySlug, userUpdateBio } from "../../services/user";

import ProfileHeader from "./ProfileHeader";

import "./Profile.css";

function Profile() {
  const { slug } = useParams();
  const accessToken = getCookie("accessToken");

  const [user, setUser] = useState<IUser>();

  const [bio, setBio] = useState("");
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);

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
      setBio(user.bio);
    }

    setIsBioModalOpen(false);
  };

  useEffect(() => {
    const fetchApi = async () => {
      const {
        data: { data },
      } = await userFindUserBySlug({ accessToken, slug: slug as string });

      setUser(data);
      setBio(data.bio);
    };
    fetchApi();
  }, [accessToken, slug]);

  return (
    <>
      <div className="profile-page">
        <div className="container">
          <ProfileHeader user={user} />

          {/* Body */}
          <Row>
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
              <Card>
                <CardHeader>
                  <CardTitle>Intro</CardTitle>
                  <CardDescription dangerouslySetInnerHTML={{ __html: bio }} />
                  <CardAction>
                    <Button variant="outline" onClick={showBioModal}>
                      Edit
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p>Card Content</p>
                </CardContent>
                <CardFooter>
                  <p>Card Footer</p>
                </CardFooter>
              </Card>
            </Col>
            <Col span={16}></Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default Profile;
