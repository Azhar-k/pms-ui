import { Outlet, type LoaderFunctionArgs } from "react-router";
import { requireAuth } from "../utils/auth";
import Layout from "./Layout";

export async function loader({ request }: LoaderFunctionArgs) {
  requireAuth(request);
  return null;
}

export default function ProtectedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

