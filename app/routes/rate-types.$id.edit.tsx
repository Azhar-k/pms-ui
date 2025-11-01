import { Form, useLoaderData, redirect } from "react-router";
import { rateTypeAPI } from "../services/api";
import { Button } from "../components/Button";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const rateType = await rateTypeAPI.getById(Number(params.id));
    return { rateType };
  } catch (error) {
    throw new Response("Rate type not found", { status: 404 });
  }
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const data = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  };

  try {
    await rateTypeAPI.update(Number(params.id), data);
    return redirect(`/rate-types/${params.id}`);
  } catch (error) {
    return { error: "Failed to update rate type" };
  }
}

export default function EditRateTypePage() {
  const { rateType } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Rate Type</h1>
        <p className="mt-2 text-gray-600">Update rate type information</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={rateType.name}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={rateType.description}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To manage room type rates, please use the detail page.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit">Update Rate Type</Button>
            <Button to={`/rate-types/${rateType.id}`} variant="secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

