# Developement Guide

## Backend database

The backend database is used to store the documents, questions, answers, and user information. The backend database is built using Django and PostgreSQL. The database can be accessed by creating a superuser and logging in to the admin panel.

### create super user

To create super user, run following command if you are using pre-built docker images:

```
cd MyGPT/installation/macOS/prebuilt_images/
bash create_superuser.sh
```

Or run following command if you are building docker images:

```
bash MyGPT/installation/macOS/build_images/create_superuser.sh
```

You can check backend database at http://localhost:8000/admin/ with username and password you created in above step.


## API Endpoints
These API endpoints are available for MyGPT backend server. This endpoint will be used for testing, evaluation and by the frontend to interact with the backend server.

<!-- - [Get datasets](#get-datasets) -->
- [Get documents](#get-documents)
- [Get context](#get-context)
- [Save answer](#save-answer)
- [Get question details](#get-question-details)
- [Get conversation history](#get-conversation-history)
- [Frontend settings](#frontend-settings)

<!-- ### Get datasets -->
 ### Get documents

 This endpoint will return the list of documents available for a specific dataset. The response will be in JSON format.

 The endpoint is:
 ```http
	GET /api/get_documents/?dataset=IDR
 ```

 The response will be:

 ```json
	{
    "documents": [
        {
            "paper_title": "Attributes of short linear motifs",
            "paper_attachment": "papers/IDR-cosine/paper1.pdf",
            "highlighted_attachment": "-",
            "paper_dataset": 239,
            "paper_date_time": "2024-07-26T20:43:05.553Z"
        },
        {
            "paper_title": "Conditionally and Transiently Disordered Proteins- Awakening Cryptic Disorder To Regulate Protein Function",
            "paper_attachment": "papers/IDR-cosine/paper2.pdf",
            "highlighted_attachment": "-",
            "paper_dataset": 239,
            "paper_date_time": "2024-07-26T20:43:05.834Z"
        }
	]
}
 ```


### Get context


### Save answer


### Get question details


### Get conversation history


### Frontend settings