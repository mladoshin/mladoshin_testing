import { useProfilePageModel } from "./model";
import { AcademyLayout } from "@/layouts/AcademyLayout/AcademyLayout";
import { UserInfo } from "@/entities/user/ui/UserInfo";

function ProfilePage() {
  const { user } = useProfilePageModel();
  return (
    <AcademyLayout>
      <h2>Профиль</h2>
      {user && <UserInfo user={user} />}
    </AcademyLayout>
  );
}

export default ProfilePage;
