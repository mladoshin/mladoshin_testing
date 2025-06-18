import AcademyHeader from "@/widgets/Header/AcademyHeader";
import classNames from "classnames";
import { ReactNode } from "react";
import styles from "./AdminLayout.module.scss";
import AdminHeader from "@/widgets/Header/AdminHeader";

interface Props {
  children: ReactNode;
}

export const AdminLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <main className={classNames(styles.main, "py-5")}>{children}</main>
    </div>
  );
};
