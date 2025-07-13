from typing import Any
import httpx
import asyncio
# from mcp.server.fastmcp import FastMCP
from fastmcp import FastMCP
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

# Initialize FastMCP server
mcp = FastMCP("MyGPT-MCP", host="0.0.0.0", port=5001)

# custom CORS middleware
custom_middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
]

# MyGPT backend service
MYGPT_BACKEND_URL = "http://host.docker.internal:8000"

async def mygpt_backend_handler(endpoint:str, email:str, additional_data: object) -> dict[Any] | None:
	"""
	Handles requests to the MyGPT backend service.
	"""
	headers = {
		"Content-Type": "application",
	}
	async with httpx.AsyncClient() as client:
		try:
			json_data = {
				"user_email": email,
				"user_group": ""
			}
			if additional_data:
				for key, value in additional_data.items():
					json_data[key] = value
			response = await client.post(
				f"{MYGPT_BACKEND_URL}{endpoint}",
				json=json_data,
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
	endpoint = "/api/get_datasets/"
	data = await mygpt_backend_handler(endpoint, user_email, additional_data={})
	dataset_names = []
	for dataset in data:
		if "dataset_name" in dataset:
			dataset_names.append(dataset["dataset_name"])

	if data is None:
		return {"error": "Failed to retrieve datasets."}
	return {
		"datasets_names": dataset_names,
	}

@mcp.tool()
async def get_mygpt_documents(user_email: str, dataset: str) -> dict[str, Any] | None:
	"""Retrieves documents for a specific dataset of a user.
	"""
	endpoint = "/api/get_documents/"
	data = await mygpt_backend_handler(endpoint, user_email, additional_data={"dataset": dataset})
	if data is None:
		return {"error": "Failed to retrieve datasets."}
	document_names = []
	if "documents" in data:
		for document in data["documents"]:
			document_names.append(document["paper_title"])
	return {
		"document_names": document_names,
	}

async def main():
	await mcp.run_async(transport="sse", middleware=custom_middleware)

if __name__ == "__main__":
   asyncio.run(main())