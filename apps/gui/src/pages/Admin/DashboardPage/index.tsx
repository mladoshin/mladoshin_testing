import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";
import { CourseList } from "@/widgets/CourseList/CourseList";
import React from "react";
import { useAdminDashboardPageModel } from "./model";

function AdminDashboardPage() {
  const { courses, handleCourseClick } = useAdminDashboardPageModel();

  return (
    <AdminLayout>
      <h2 className="text-black text-2xl font-semibold mb-6">Мероприятия</h2>
      <CourseList
        courses={courses}
        onCourseClick={handleCourseClick}
      />
    </AdminLayout>
  );
}

export default AdminDashboardPage;
