"use client";

import MyProfile from "@/components/profile/MyProfile";

export default function ProfilePage() {
  return (
    <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-100px)] flex flex-col">
      <MyProfile />
    </div>
  );
}
