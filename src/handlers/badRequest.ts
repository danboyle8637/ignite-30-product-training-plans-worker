export async function badRequest() {
	const response = new Response("Bad Request", { status: 500 });
	return response;
}
