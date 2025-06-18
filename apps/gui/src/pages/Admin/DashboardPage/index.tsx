import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";
import { CourseList } from "@/widgets/CourseList/CourseList";
import React from "react";
import { useAdminDashboardPageModel } from "./model";
import {
  CreateCourseAdminModal,
  EditCourseAdminModal,
} from "@/widgets/CourseAdminModal";
import { Button } from "@/shared/ui/Button";
import { PlusIcon } from "@heroicons/react/24/outline";

function AdminDashboardPage() {
  const {
    courses,
    openCreateCourseModal,
    loading,
    onOpenCreateCourseModal,
    onCloseCreateCourseModal,
    handleCourseClick,
  } = useAdminDashboardPageModel();

  return (
    <AdminLayout>
      <div className="flex flex-row items-center mt-10 justify-between">
        <h2 className="text-black text-2xl font-semibold mb-6">Мероприятия</h2>
        <Button
          className="!w-[150px] text-sm"
          iconRight={<PlusIcon />}
          onClick={onOpenCreateCourseModal}
        >
          Добавить
        </Button>
      </div>

      <CourseList
        courses={courses}
        onCourseClick={handleCourseClick}
        loading={loading.fetch}
      />

      <CreateCourseAdminModal
        onClose={onCloseCreateCourseModal}
        isOpen={openCreateCourseModal}
      />
    </AdminLayout>
  );
}

export default AdminDashboardPage;
