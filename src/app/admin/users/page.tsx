import { getUsers, getCompanies } from "@/actions/admin";
import UserManagement from "./UserManagement";

export default async function AdminUsersPage() {
    const users = await getUsers();
    const companies = await getCompanies();

    return <UserManagement initialUsers={users} companies={companies} />;
}
