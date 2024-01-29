import { ReactNode } from "react";
import { MDXTheme } from "../components/MdxTheme";
import { BasicLayout } from "./Basic";

export function PostLayout({ children }: { children: ReactNode }) {
  return (
    <BasicLayout>
      <MDXTheme>{children}</MDXTheme>
    </BasicLayout>
  );
}
