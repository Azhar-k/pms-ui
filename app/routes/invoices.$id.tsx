import { useLoaderData, Link, Form, redirect } from "react-router";
import { invoiceAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const invoice = await invoiceAPI.getById(Number(params.id));
    return { invoice };
  } catch (error) {
    throw new Response("Invoice not found", { status: 404 });
  }
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const actionType = formData.get("action");

  try {
    if (actionType === "markAsPaid") {
      const paymentMethod = formData.get("paymentMethod") as string;
      await invoiceAPI.markAsPaid(Number(params.id), paymentMethod);
    } else if (actionType === "addItem") {
      const data = {
        description: formData.get("description"),
        quantity: Number(formData.get("quantity")),
        unitPrice: Number(formData.get("unitPrice")),
        category: formData.get("category") || undefined,
      };
      await invoiceAPI.addItem(Number(params.id), data);
    }
    return redirect(`/invoices/${params.id}`);
  } catch (error) {
    return { error: "Action failed" };
  }
}

export default function InvoiceDetailPage() {
  const { invoice } = useLoaderData<typeof loader>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      PARTIALLY_PAID: "bg-blue-100 text-blue-800",
      OVERDUE: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const canAddItem = invoice.status === "PENDING";
  const canMarkAsPaid = invoice.status === "PENDING";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice {invoice.invoiceNumber || `#${invoice.id}`}
          </h1>
          <p className="mt-2 text-gray-600">Invoice details and billing information</p>
        </div>
        <Button to="/invoices" variant="secondary">
          Back to Invoices
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {invoice.invoiceNumber || `#${invoice.id}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Reservation</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {invoice.reservation ? (
                  <Link
                    to={`/reservations/${invoice.reservationId}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Reservation #{invoice.reservation.id}
                  </Link>
                ) : (
                  `Reservation #${invoice.reservationId}`
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(invoice.issuedDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(invoice.dueDate)}</dd>
            </div>
            {invoice.paidDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Paid Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(invoice.paidDate)}</dd>
              </div>
            )}
            {invoice.paymentMethod && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900">{invoice.paymentMethod}</dd>
              </div>
            )}
          </dl>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h3>
            {invoice.items && invoice.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${item.unitPrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${item.amount?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No items in this invoice.</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">${invoice.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">${invoice.taxAmount?.toFixed(2) || "0.00"}</span>
                  </div>
                )}
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-gray-900">
                      -${invoice.discountAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>${invoice.totalAmount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {canAddItem && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Item</h2>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="addItem" />
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      defaultValue="1"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      step="0.01"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Item
                </Button>
              </Form>
            </div>
          )}

          {canMarkAsPaid && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mark as Paid</h2>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="markAsPaid" />
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Select payment method</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Button type="submit" variant="success" className="w-full">
                  Mark as Paid
                </Button>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

