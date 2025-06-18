import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@pages/LoginPage";
import { RegisterPage } from "@pages/RegisterPage";
import { AllCoursesPage } from "@/pages/AllCoursesPage";
import { PrivateRoute } from "@/shared/routing/PrivateRoute";
import { CoursePage } from "@/pages/CoursePage";
import { AcademyAllCoursesPage } from "@/pages/Academy/AllCoursesPage";
import { AcademyCoursePage } from "@/pages/Academy/CoursePage";
import ProfilePage from "@/pages/ProfilePage";
import { AcademyAboutCoursePage } from "@/pages/Academy/AboutCoursePage";
import { AdminRoute } from "@/shared/routing/AdminRoute";
import AdminDashboardPage from "@/pages/Admin/DashboardPage";
import { AdminCoursePage } from "@/pages/Admin/CoursePage";
import ForbiddenPage from "@/pages/Error/ForbiddenPage";
import NotFoundPage from "@/pages/Error/NotFoundPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AllCoursesPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  { path: "/courses/:id/about", element: <CoursePage /> },
  { path: "/courses", element: <AllCoursesPage /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: "/profile", element: <ProfilePage /> },
      { path: "/academy", element: <AcademyAllCoursesPage /> },
      { path: "/academy/courses", element: <AcademyAllCoursesPage /> },
      { path: "/academy/courses/:id", element: <AcademyCoursePage /> },
      {
        path: "/academy/courses/:id/about",
        element: <AcademyAboutCoursePage />,
      },
    ],
  },
  {
    element: <AdminRoute />,
    path: "/admin",
    children: [
      { path: "/admin", element: <Navigate to="/admin/courses" /> },
      { path: "/admin/courses", element: <AdminDashboardPage /> },
      { path: "/admin/courses/:id", element: <AdminCoursePage /> },
    ],
  },

  // Страницы ошибок
  { path: "/403", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
