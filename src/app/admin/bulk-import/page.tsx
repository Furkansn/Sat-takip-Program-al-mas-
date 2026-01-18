import { getCompanies } from "@/actions/admin";
import BulkImportWizard from "./BulkImportWizard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BulkImportPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'super_admin') {
        redirect("/");
    }

    const companies = await getCompanies();

    return <BulkImportWizard companies={companies} />;
}
