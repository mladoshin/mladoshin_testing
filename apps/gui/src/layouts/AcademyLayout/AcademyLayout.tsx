import AcademyHeader from "@/widgets/Header/AcademyHeader";
import classNames from "classnames";
import { ReactNode, useEffect } from "react";
import styles from "./AcademyLayout.module.scss";
import { useAuthStore } from "@/features/auth/model/store";

interface Props {
  children: ReactNode;
}

export const AcademyLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AcademyHeader />
      <main className={classNames(styles.main, "py-5")}>{children}</main>
    </div>
  );
};
