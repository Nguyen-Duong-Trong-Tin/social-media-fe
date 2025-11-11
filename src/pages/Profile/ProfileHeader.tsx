import { Image } from "antd";

import type IUser from "@/interfaces/user.interface";

function ProfileHeader({ user }: { user?: IUser }) {
  return (
    <>
      <div className="cover-photo">
        {user && (
          <Image
            src={
              user.coverPhoto
                ? user.coverPhoto
                : "https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/anh-bia-facebook-3.jpg"
            }
          />
        )}
      </div>

      <div className="avatar">
        <div className="avatar-container">
          {user && (
            <Image
              className="avatar-image"
              src={
                user.avatar
                  ? user.avatar
                  : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
              }
            />
          )}
        </div>
      </div>

      <div className="full-name">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {user && user.fullName}
        </h2>
      </div>
    </>
  );
}

export default ProfileHeader;
