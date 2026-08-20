from typing import Any
import typing as _typing
import functools as _functools

# Python 3.15 removed the deprecated `typing.no_type_check_decorator`, but
# `beartype` (via fastmcp's key-value dependency) still imports it unconditionally.
if not hasattr(_typing, "no_type_check_decorator"):
    def _no_type_check_decorator(decorator):
        @_functools.wraps(decorator)
        def wrapped_decorator(*args, **kwds):
            func = decorator(*args, **kwds)
            return _typing.no_type_check(func)
        return wrapped_decorator

    _typing.no_type_check_decorator = _no_type_check_decorator

# Python 3.15's importlib now passes an extra `fullname` arg to `source_to_code`,
# which beartype's claw import-hook loader (used by fastmcp's key-value dep)
# doesn't accept yet. Wrap it so the extra arg is dropped instead of raising.
try:
    from beartype.claw._importlib import _clawimpload as _beartype_clawimpload

    _orig_source_to_code = _beartype_clawimpload.BeartypeSourceFileLoader.source_to_code

    def _patched_source_to_code(self, data, path, fullname=None, *, _optimize=-1):
        return _orig_source_to_code(self, data, path, _optimize=_optimize)

    _beartype_clawimpload.BeartypeSourceFileLoader.source_to_code = _patched_source_to_code
except ImportError:
    pass

import httpx
import asyncio
# from mcp.server.fastmcp import FastMCP
from fastmcp import FastMCP
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
import re

# Initialize FastMCP server
mcp = FastMCP("MyGPT-MCP")

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
async def get_pubmed_id_from_question(pubmed_id: str) -> dict[str, Any] | None:
    """
    Retrieves PubMed ID from a question. the pubmed_id will be in the format '12345678'
    Get the number from the question and return as a single string. If no number is found, return an error message.

        Args:
            pubmed_id: The question containing the PubMed ID.

        Returns:
            A dictionary containing the extracted pubmed_id or an error message if no valid ID is found.
    """

    # convert the input to string in case it's not
    pubmed_id_str = str(pubmed_id)
    # Use regular expression to find a sequence of 8 digits in the input string
    match = re.search(r'\b\d{8}\b', pubmed_id_str)
    if match:        
        pubmed_id = match.group(0)
        return {"pubmed_id": pubmed_id}
    else:        
        return {"error": "No valid PubMed ID found in the question."}

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

@mcp.tool()
async def search_pdb(query: str) -> dict[str, Any]:
    """
    Search the RCSB Protein Data Bank (PDB) for entries matching the query and return details.
    Uses the PDB Search API v2 for IDs and the Data API v1 for entry details.
    
    Args:
        query: Search term (protein name, keyword, etc.)
        
    Returns:
        A dictionary containing search results or error information.
    """
    search_url = "https://search.rcsb.org/rcsbsearch/v2/query"
    data_url = "https://data.rcsb.org/rest/v1/core/entry"

    # Search payload for PDB API
    search_payload = {
        "query": {
            "type": "terminal",
            "service": "full_text",
            "parameters": {
                "value": query
            }
        },
        "return_type": "entry",
        "request_options": {
            "paginate": {
                "start": 0,
                "rows": 10
            }
        }
    }
    
    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Step 1: Search for PDB IDs
            search_response = await client.post(search_url, json=search_payload, headers=headers)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            # Extract PDB IDs from response
            pdb_ids = []
            if "result_set" in search_data:
                pdb_ids = [result["identifier"] for result in search_data["result_set"]]
            elif "results" in search_data:
                pdb_ids = [result["identifier"] for result in search_data["results"]]

            if not pdb_ids:
                return {
                    "success": True,
                    "query": query,
                    "total_found": 0,
                    "results": [],
                    "message": f"No PDB entries found for '{query}'"
                }

            # Step 2: Fetch details for each PDB ID
            results = []
            for pdb_id in pdb_ids:
                entry_detail_url = f"{data_url}/{pdb_id}"
                try:
                    detail_response = await client.get(entry_detail_url)
                    detail_response.raise_for_status()
                    entry_data = detail_response.json()

                    # Extract relevant information using safe dict access
                    title = entry_data.get("struct", {}).get("title", "No title available")
                    
                    release_date = entry_data.get("rcsb_accession_info", {}).get("initial_release_date", "Unknown")
                    if release_date != "Unknown" and "T" in release_date:
                        release_date = release_date.split("T")[0]

                    experimental_method = entry_data.get("exptl", [{}])[0].get("method", "Unknown")
                    
                    # Get authors
                    authors = [author.get("name") for author in entry_data.get("audit_author", []) if author.get("name")]

                    results.append({
                        "pdb_id": pdb_id,
                        "title": title,
                        "release_date": release_date,
                        "experimental_method": experimental_method,
                        "authors": authors[:5]  # Limit to first 5 authors
                    })
                    
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 404:
                        results.append({
                            "pdb_id": pdb_id,
                            "error": f"PDB ID '{pdb_id}' not found"
                        })
                    else:
                        results.append({
                            "pdb_id": pdb_id,
                            "error": f"HTTP error {e.response.status_code} fetching details"
                        })
                except httpx.RequestError as e:
                    results.append({
                        "pdb_id": pdb_id,
                        "error": f"Request error: {str(e)}"
                    })
                except Exception as e:
                    results.append({
                        "pdb_id": pdb_id,
                        "error": f"Unexpected error: {str(e)}"
                    })

            return {
                "success": True,
                "query": query,
                "total_found": len(results),
                "results": results,
                "message": f"Found {len(results)} PDB entries matching '{query}'"
            }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"error": f"Search API endpoint not found"}
            return {"error": f"HTTP error occurred during search: {e.response.status_code}"}
        except httpx.RequestError as e:
            return {"error": f"Request to PDB search failed: {e}"}
        except Exception as e:
            return {"error": f"An unexpected error occurred: {e}"}
        
@mcp.tool()
async def get_pdb_details(pdb_id: str):
    """
    Search the RCSB Protein Data Bank (PDB) for PDB ID and return details.

    Args:
        pdb_id: The PDB ID to search for.

    Returns:
        A dictionary containing PDB entry details or error information.
    """
    async with httpx.AsyncClient() as client:
        data_url = "https://data.rcsb.org/rest/v1/core/entry"
        try:
            response = await client.get(f"{data_url}/{pdb_id}")
            response.raise_for_status()
            entry_data = response.json()

            # Extract relevant information using safe dict access
            title = entry_data.get("struct", {}).get("title", "No title available")
            release_date = entry_data.get("rcsb_accession_info", {}).get("initial_release_date", "Unknown")
            if release_date != "Unknown" and "T" in release_date:
                release_date = release_date.split("T")[0]
            experimental_method = entry_data.get("exptl", [{}])[0].get("method", "Unknown")
            resolution = entry_data.get("rcsb_entry_info", {}).get("resolution_combined", ["Unknown"])

            authors = [author.get("name") for author in entry_data.get("audit_author", []) if author.get("name")]

            return {
                "success": True,
                "pdb_id": pdb_id,
                "title": title,
                "release_date": release_date,
                "experimental_method": experimental_method,
                "resolution": resolution,
                "authors": authors[:5]  # Limit to first 5 authors
            }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"error": f"PDB ID '{pdb_id}' not found"}
            else:
                return {"error": f"HTTP error {e.response.status_code} fetching details"}
        except httpx.RequestError as e:
            return {"error": f"Request error: {str(e)}"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}

if __name__ == "__main__":
   asyncio.run(main())