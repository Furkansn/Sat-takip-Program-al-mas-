import { getCompanies } from "@/actions/admin";
import CompanyManagement from "./CompanyManagement";

export default async function AdminCompaniesPage() {
    const companies = await getCompanies();

    return <CompanyManagement initialCompanies={companies} />;
}
