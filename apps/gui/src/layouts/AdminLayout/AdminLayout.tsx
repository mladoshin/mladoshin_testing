import AcademyHeader from "@/widgets/Header/AcademyHeader";
import classNames from "classnames";
import { ReactNode } from "react";
import styles from "./AdminLayout.module.scss";

interface Props {
  children: ReactNode;
}

export const AdminLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AcademyHeader />
      <main className={classNames(styles.main, "py-5")}>{children}</main>
    </div>
  );
};
