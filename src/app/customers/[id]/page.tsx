import CustomerDetailView from "@/components/CustomerDetailView";
import { getCustomerDetails } from "@/actions/customer";
import { notFound } from "next/navigation";

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
    const customer = await getCustomerDetails(params.id);

    if (!customer) {
        notFound();
    }

    return (
        <main className="container">
            <CustomerDetailView customer={customer} />
        </main>
    );
}
