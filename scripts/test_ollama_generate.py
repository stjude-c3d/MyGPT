#!/usr/bin/env python3
"""
Test script for backend /api/ollama_generate/ endpoint with streaming support.

Usage:
    python test_ollama_generate.py
    python test_ollama_generate.py --model llama3 --question "What is AI?"
    python test_ollama_generate.py --url http://your-host/api/ollama_generate/
"""

import requests
import json
import argparse
import sys
from typing import Dict, Any


def test_ollama_generate(
    url: str = "http://localhost/api/ollama_generate/",
    model_name: str = "llama3",
    question: str = "Why is the sky blue?",
    timeout: int = 60,
) -> Dict[str, Any]:
    """
    Test the /api/ollama_generate/ endpoint (JSON Lines streaming).

    Args:
        url: Backend API endpoint URL
        model_name: LLM model name (e.g., 'llama3')
        question: Question to ask the model
        timeout: Request timeout in seconds

    Returns:
        Dictionary with status, response data, and any errors
    """
    payload = {
        "model": model_name,
        "prompt": question
    }

    print(f"\n{'='*70}")
    print(f"Testing Backend Ollama Generate Endpoint (Streaming)")
    print(f"{'='*70}")
    print(f"URL: {url}")
    print(f"Method: POST")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print(f"Timeout: {timeout}s")
    print(f"{'-'*70}\n")

    try:
        print(f"Sending POST request (streaming)...")
        response = requests.post(
            url,
            json=payload,
            timeout=timeout,
            headers={"Content-Type": "application/json"},
            stream=True,
        )

        print(f"Response Status Code: {response.status_code}")
        print(f"{'-'*70}\n")

        if response.status_code != 200:
            print(f"✗ ERROR: Status code {response.status_code}")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "data": error_data,
                }
            except json.JSONDecodeError:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "data": response.text,
                }

        print("Streaming response:\n")
        full_response = ""
        full_thinking = ""
        chunk_count = 0
        thinking_chunk_count = 0
        stream_done = False

        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue

            try:
                data = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"\n✗ Invalid JSON line: {line}")
                return {
                    "status": "error",
                    "error": f"Invalid JSON line: {e}",
                    "partial_response": full_response,
                    "partial_thinking": full_thinking,
                }

            if data.get("error"):
                print(f"\n✗ Stream error: {data.get('error_message', 'Unknown error')}")
                return {
                    "status": "error",
                    "error": data.get("error_message", "Unknown error"),
                    "partial_response": full_response,
                    "partial_thinking": full_thinking,
                }

            if data.get("done"):
                stream_done = True
                break

            stream_type = data.get("type", "response")
            chunk = data.get("content", "")
            
            if stream_type == "thinking":
                if chunk:
                    thinking_chunk_count += 1
                    full_thinking += chunk
                    print(chunk, end="", flush=True)
            elif stream_type == "response":
                if chunk:
                    chunk_count += 1
                    full_response += chunk
                    print(chunk, end="", flush=True)
            elif stream_type == "done":
                stream_done = True
                break

        print("\n")

        if not stream_done:
            print("✗ Stream ended without done=true")
            return {
                "status": "error",
                "error": "Stream ended without completion flag",
                "chunks": chunk_count,
                "thinking_chunks": thinking_chunk_count,
                "partial_response": full_response,
                "partial_thinking": full_thinking,
            }

        print(f"{'='*70}")
        print("✓ SUCCESS: Stream completed")
        print(f"Response chunks: {chunk_count}, {len(full_response)} characters")
        if thinking_chunk_count > 0:
            print(f"Thinking chunks: {thinking_chunk_count}, {len(full_thinking)} characters")
        print(f"{'='*70}")

        return {
            "status": "success",
            "status_code": response.status_code,
            "chunks": chunk_count,
            "thinking_chunks": thinking_chunk_count,
            "response": full_response,
            "thinking": full_thinking,
        }

    except requests.exceptions.Timeout:
        print(f"\n✗ ERROR: Request timeout after {timeout}s")
        print(f"The backend may be slow or not responding.")
        return {
            "status": "error",
            "error": f"Request timeout after {timeout}s",
            "message": "Backend may be slow or unresponsive"
        }

    except requests.exceptions.ConnectionError as e:
        print(f"\n✗ ERROR: Connection failed")
        print(f"Cannot reach {url}")
        print(f"Error: {e}")
        return {
            "status": "error",
            "error": "Connection failed",
            "message": f"Cannot reach backend at {url}",
            "details": str(e)
        }

    except requests.exceptions.RequestException as e:
        print(f"\n✗ ERROR: Request failed")
        print(f"Error: {e}")
        return {
            "status": "error",
            "error": "Request failed",
            "message": str(e)
        }


def main():
    parser = argparse.ArgumentParser(
        description="Test backend /api/ollama_generate/ streaming endpoint"
    )
    parser.add_argument(
        "--url",
        default="http://localhost/api/ollama_generate/",
        help="Backend API URL (default: http://localhost/api/ollama_generate/)"
    )
    parser.add_argument(
        "--model",
        default="llama3",
        help="Model name to use (default: llama3)"
    )
    parser.add_argument(
        "--question",
        default="Why is the sky blue?",
        help="Question to ask (default: 'Why is the sky blue?')"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60,
        help="Request timeout in seconds (default: 60)"
    )

    args = parser.parse_args()

    result = test_ollama_generate(
        url=args.url,
        model_name=args.model,
        question=args.question,
        timeout=args.timeout
    )

    # Exit with error code if test failed
    if result["status"] == "error":
        print(f"\nTest FAILED")
        sys.exit(1)
    else:
        print(f"\nTest PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
