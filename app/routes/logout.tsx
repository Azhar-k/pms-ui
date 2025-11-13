import { redirect } from "react-router";
import { authAPI } from "../services/auth";

export async function action() {
  await authAPI.logout();
  return redirect("/login");
}

