from typing import Any
import httpx
import asyncio
# from mcp.server.fastmcp import FastMCP
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("MyGPT-MCP", host="0.0.0.0", port=5001)

# MyGPT backend service
MYGPT_BACKEND_URL = "http://host.docker.internal:8000"

async def mygpt_backend_handler(email:str) -> dict[str, Any] | None:
	"""
	Handles requests to the MyGPT backend service.
	"""
	headers = {
		"Content-Type": "application",
	}
	async with httpx.AsyncClient() as client:
		try:
			response = await client.post(
				f"{MYGPT_BACKEND_URL}/api/get_datasets/",
				json={
					"user_email": email,
					"user_group": ""
					},
				headers=headers,
				timeout=10.0  # Set a timeout for the request
			)
			response.raise_for_status()
			return response.json()
		except httpx.HTTPStatusError as e:
			print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
		except httpx.RequestError as e:
			print(f"Request error occurred: {e}")
		except Exception as e:
			print(f"An unexpected error occurred: {e}")
	return None

@mcp.tool()
async def get_mygpt_datasets(user_email: str) -> dict[str, Any] | None:
	"""
	Retrieves datasets for a user.
	"""
	data = await mygpt_backend_handler(user_email)
	dataset_names = []
	for dataset in data:
		if "dataset_name" in dataset:
			dataset_names.append(dataset["dataset_name"])

	if data is None:
		return {"error": "Failed to retrieve datasets."}
	return {
		"datasets_names": dataset_names,
	}

async def main():
	await mcp.run_async(transport="sse")

if __name__ == "__main__":
   asyncio.run(main())