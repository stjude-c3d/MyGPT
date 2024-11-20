# Developer's Guide

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

- [Get datasets](#get-datasets)
- [Get documents](#get-documents)
- [Get context](#get-context)
- [Save answer](#save-answer)
- [Get question details](#get-question-details)
- [Get conversation history](#get-conversation-history)
- [Frontend settings](#frontend-settings)

### Get datasets

This endpoint will return the list of datasets available in the backend database. The response will be in JSON format.

The endpoint is:
```
POST /api/get_datasets/
```

The request body will be:

```json
{
	"user_email": "abc@xyz.com",
	"user_group": ""
}
```

The response will be:

```json
{
	"datasets": [
		 {
			"dataset_name": "GPCR",
			"zotero_id": "-",
			"dataset_size": 3366,
			"user": "Patel_Jaimin",
			"user_email": "jpatel2@stjude.org",
			"user_group": "user",
			"embedding_added": true,
			"embedding_model": "multi-qa-MiniLM-L6-cos-v1",
			"chunksize": 1000,
			"overlap": true,
			"distance_function": "l2",
			"direct_chat_without_docs": false,
			"dataset_date_time": "2024-10-19T18:58:12.267Z"
		},
		{
			"dataset_name": "Harry_Potter_book_1",
			"zotero_id": "-",
			"dataset_size": 680,
			"user": "Patel_Jaimin",
			"user_email": "jpatel2@stjude.org",
			"user_group": "user",
			"embedding_added": true,
			"embedding_model": "multi-qa-MiniLM-L6-cos-v1",
			"chunksize": 1000,
			"overlap": true,
			"distance_function": "l2",
			"direct_chat_without_docs": false,
			"dataset_date_time": "2024-10-19T19:15:07.298Z"
		},
	]
}
```

### Get documents

 This endpoint will return the list of documents available for a specific dataset. The response will be in JSON format.

 The endpoint is:
 ```
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

This endpoint will return the context (chunks) from the document to answer the user provided question. The response will be in JSON format.

The endpoint is:
```
POST /api/get_context/
```

The request body will be:

```json
{
    "text": "Which cohorts are available from Survivorship portal?",
    "model_type": "llama3:latest",
    "dataset": "Survivorship",
    "new_conversation": true,
    "related_query": false,
    "previous_query": "",
    "no_context": false,
    "use_default_qrs": true,
    "question_best_distance": 0.2,
    "question_worst_distance": 1.7
}
```

The response will be:
```json
{
    "context": "ding individual survivor data for offline analysis. These features will enable on-demand access and open-ended exploration, allowing the St. Jude Survivorship Portal to serve as a valuable resource for the survivorship research community and beyond. Resul ts Overview of the Portal The St. Jude Survivorship Portal is a free, open-access data portal that hosts data from two childhood cancer survivor - ship cohorts: the SJLIFE and the CCSS (Fig. 1A; Supple- mentary Fig. S1; Supplementary Table S1). A total of 5,053 SJLIFE survivors and 2,688 CCSS survivors were included in the portal based on inclusion criteria described in “Methods.” Cohort phenotypic data consist of variables ranging from demographics, cancer diagnoses, treatments, clinical assess- ments, graded chronic health conditions, and self-reported symptoms of survivors with up to several decades of follow up (Supplementary Table S2). We have organized these data into a hierarchical data dictionary that users can easily nare avail- able through either the data dictionary or genome browser on the portal. Navigation through the St. Jude Survivorship Portal is guided by four main tabs: “COHORT,” “CHARTS,” “GROUPS,” and “FILTER” (Fig. 1B; Supplementary Tutorial). The portal begins in the “COHORT” tab where users can select either the SJLIFE cohort, CCSS cohort, or both. The “FILTER” tab can then be used to refine the cohort by one or more variables in AND/OR combinations. For example, the cohort can be restricted to those survivors who were diag-nosed with cancer before age 5 years and who were exposed to either anthracycline chemotherapy or chest radiotherapy (Fig. 1B). In the “GROUPS” tab, users can divide the cohort into custom groups for comparative analysis (e.g., exposed group vs. nonexposed group). In the “CHARTS” tab, users can launch a set of features to explore, analyze, visualize, or export the data of the cohort/groups defined by the COHORT, FILTER, and GROUPS tabs. The “data dictionarancer survivorship data. Methods Data Sources The portal hosts data generated by the SJLIFE (December 2018 data freeze; refs. 9, 10) and the CCSS (January 2020 data freeze; refs. 11, 12). Both cohorts are retrospective cohorts with prospective fol-low-up of childhood cancer survivors who have survived at least 5 years following their diagnosis. Survivors in the SJLIFE cohort were diagnosed between 1962 and 2012 and treated at St. Jude Children’s Research Hospital. Survivors in the CCSS cohort were diagnosed between 1970 and 1999 and treated at one of 31 pediatric oncology institutions in the US and Canada (Supplementary Table S1). Inclusion in the portal was determined as follows. For the SJLIFE cohort, all survivors with WGS data were included in the portal. Ad-ditionally, survivors without WGS but who visited the St. Jude cam-pus for clinical assessments were also included in the portal. For the CCSS cohort, survivors with WGS and who were not SJLIFE survivors were included in the",
    "relevance_score": 61,
    "sources": [
        {
            "document": "St. Jude Survivorship Portal",
            "page": 3,
            "start": "",
            "stop": "",
            "context": "ding individual survivor data for offline analysis. These features will enable on-demand access and open-ended exploration, allowing the St. Jude Survivorship Portal to serve as a valuable resource for the survivorship research community and beyond. Resul ts Overview of the Portal The St. Jude Survivorship Portal is a free, open-access data portal that hosts data from two childhood cancer survivor - ship cohorts: the SJLIFE and the CCSS (Fig. 1A; Supple- mentary Fig. S1; Supplementary Table S1). A total of 5,053 SJLIFE survivors and 2,688 CCSS survivors were included in the portal based on inclusion criteria described in “Methods.” Cohort phenotypic data consist of variables ranging from demographics, cancer diagnoses, treatments, clinical assess- ments, graded chronic health conditions, and self-reported symptoms of survivors with up to several decades of follow up (Supplementary Table S2). We have organized these data into a hierarchical data dictionary that users can easily n",
            "distance": 0.624
        },
        {
            "document": "St. Jude Survivorship Portal",
            "page": 3,
            "start": "",
            "stop": "",
            "context": "are avail- able through either the data dictionary or genome browser on the portal. Navigation through the St. Jude Survivorship Portal is guided by four main tabs: “COHORT,” “CHARTS,” “GROUPS,” and “FILTER” (Fig. 1B; Supplementary Tutorial). The portal begins in the “COHORT” tab where users can select either the SJLIFE cohort, CCSS cohort, or both. The “FILTER” tab can then be used to refine the cohort by one or more variables in AND/OR combinations. For example, the cohort can be restricted to those survivors who were diag-nosed with cancer before age 5 years and who were exposed to either anthracycline chemotherapy or chest radiotherapy (Fig. 1B). In the “GROUPS” tab, users can divide the cohort into custom groups for comparative analysis (e.g., exposed group vs. nonexposed group). In the “CHARTS” tab, users can launch a set of features to explore, analyze, visualize, or export the data of the cohort/groups defined by the COHORT, FILTER, and GROUPS tabs. The “data dictionar",
            "distance": 0.673
        },
        {
            "document": "St. Jude Survivorship Portal",
            "page": 11,
            "start": "",
            "stop": "",
            "context": "ancer survivorship data. Methods Data Sources The portal hosts data generated by the SJLIFE (December 2018 data freeze; refs. 9, 10) and the CCSS (January 2020 data freeze; refs. 11, 12). Both cohorts are retrospective cohorts with prospective fol-low-up of childhood cancer survivors who have survived at least 5 years following their diagnosis. Survivors in the SJLIFE cohort were diagnosed between 1962 and 2012 and treated at St. Jude Children’s Research Hospital. Survivors in the CCSS cohort were diagnosed between 1970 and 1999 and treated at one of 31 pediatric oncology institutions in the US and Canada (Supplementary Table S1). Inclusion in the portal was determined as follows. For the SJLIFE cohort, all survivors with WGS data were included in the portal. Ad-ditionally, survivors without WGS but who visited the St. Jude cam-pus for clinical assessments were also included in the portal. For the CCSS cohort, survivors with WGS and who were not SJLIFE survivors were included in the",
            "distance": 0.716
        }
    ]
}
```

### Save answer

This endpoint will save the answer generated by the LLM for user provided question. It will also give answer relevance score (ARS) and hallucination index (HI). The response will be in JSON format.

The endpoint is:
```
POST /api/save_answer/
```

The request body will be:

```json
{
    "question_text": "Which cohorts are available from Survivorship portal?",
    "answer_text": "According to the text, the St. Jude Survivorship Portal hosts data from two childhood cancer survivor cohorts:\n\n1. The SJLIFE (St. Jude Lifetime) cohort: This cohort includes 5,053 survivors who were diagnosed between 1962 and 2012 and treated at St. Jude Children's Research Hospital.\n2. The CCSS (Children's Oncology Group Childhood Cancer Survivor Study) cohort: This cohort includes 2,688 survivors who were diagnosed between 1970 and 1999 and treated at one of 31 pediatric oncology institutions in the US and Canada.\n\nBoth cohorts are retrospective cohorts with prospective follow-up of childhood cancer survivors who have survived at least 5 years following their diagnosis.",
    "answer_no_context_text": "According to the Survivorship Portal, the following cohorts are available:\n\n1. Breast Cancer Cohort: This cohort includes women diagnosed with breast cancer who have completed treatment and are seeking information on survivorship and quality of life.\n2. Colorectal Cancer Cohort: This cohort includes individuals diagnosed with colorectal cancer who have completed treatment and are looking for resources and support related to their diagnosis.\n3. Lung Cancer Cohort: This cohort includes individuals diagnosed with lung cancer who have completed treatment and are seeking information on survivorship, quality of life, and managing late effects.\n4. Ovarian Cancer Cohort: This cohort includes women diagnosed with ovarian cancer who have completed treatment and are looking for resources and support related to their diagnosis.\n\nPlease note that the availability of specific cohorts may vary depending on your location and other factors.",
    "model_type": "llama3:latest",
    "dataset": "Survivorship",
    "no_context": false,
    "use_default_ars": true,
    "answer_best_distance": 0.12,
    "answer_worst_distance": 1.42,
    "use_default_hi": true,
    "a_hi": 1,
    "b_hi": 0.5,
    "c_hi": 0.5,
    "temperature": 0.4,
    "top_k": 20,
    "top_p": 0.7
}
```

The response will be:

```json
{
    "saved": true,
    "mean_distance_a": 0.402,
    "relevance_score": 73,
    "hallucination_index": 22
}
```


### Get question details

This endpoint will return the details of the question asked by the user. The response will be in JSON format.

The endpoint is:
```
GET /api/get_question_details/?question_id=1
```

The response will be:

```json
{
    "question": "Is MyGPT another open-source GPT model?",
    "relevance_score": 66,
    "ground_truth": "-",
    "question_type": "other",
    "keywords": "",
    "llm": "llama2:latest",
    "answers": [
        {
            "answer": "No, MyGPT is not an open-source GPT model. According to the text, MyGPT is a complete, end-to-end pipeline built with open-source tools that are small enough for local installation on a laptop/personal computer or institutional servers/VM or cloud. The text also mentions that users can download any of the additional 90+ open-source LLMs available through Ollama via a command-line interface and use them in MyGPT. This suggests that MyGPT is a platform that leverages open-source LLMs, but is not itself an open-source GPT model.",
            "relevance_score": 49,
            "hallucination_index": 43,
            "answer_no_context": "\nNo, MyGPT is not another open-source GPT (Generative Pre-trained Transformer) model. While it is built on top of the transformer architecture and uses some of the same techniques as other open-source GPT models like BERT and RoBERTa, MyGPT has its own unique features and capabilities. MyGPT is designed to be more flexible and customizable than other GPT models, allowing users to fine-tune it for specific tasks and domains. Additionally, MyGPT includes a number of innovations and improvements over traditional GPT models, such as its use of a novel attention mechanism and its ability to handle long-range dependencies."
        }
    ],
    "sources": [
        {
            "paper": "MyGPT Manuscript",
            "page": 6,
            "context": "Users can also download any of the additional 90+ open-source LLMs available through Ollama via a command-line interface and use them in MyGPT. Ollama’s performance depends on the available GPU, making access to GPU an essential component of running MyGPT. We tested several different model sizes to generate answers for different tasks. ",
            "distance": 0.702
        },
        {
            "paper": "MyGPT Manuscript",
            "page": 13,
            "context": "13 Code availability All code, data, and tools are available at https://github.com/mb-group/MyGPT [This link is currently private. We have provided the source code as supplementary material for the review process. We have also provided a URL with username and password for each reviewer to the journal editor. Please contact them if you prefer to evaluate the hosted version of MyGPT]. Our code and data are licensed under GPL-3.0 license, while LLM models and LLM tools used for the project are available under the licenses of the respective sources. Author Contributions J.P. and M.M.B. conceived the MyGPT concept and the relevance metrics. J.P. and J.D. contributed equally to designing a prototype for MyGPT software. J.P. developed the MyGPT software and pipeline. B.M., V.T., and D.M. helped with multiple rounds of manual evaluation of the dataset. J.P. and J.D. performed automated evaluation with Ragas. D.M. helped with code review, S.A. ",
            "distance": 0.711
        },
        {
            "paper": "MyGPT Manuscript",
            "page": 12,
            "context": "However, in contrast to the existing products, MyGPT is a complete, end-to-end pipeline built with open-source tools that are small enough for local installation on a laptop/personal computer or institutional servers/VM or cloud. MyGPT offers essential features — such as source surfacing, context highlighting, relevance scores, and hallucination index — while providing users complete control over their data by prioritizing privacy and customizations. We developed MyGPT to facilitate scientific research with academics in mind, but the ability to run it locally, to customize and optimize it for different use cases makes it invaluable to handle proprietary or confidential information in non-academic settings, such as hospitals, as well as for commercial and legal organizations (Figure 5B). ",
            "distance": 0.799
        },
        {
            "paper": "MyGPT Figures",
            "page": 3,
            "context": "Figure 3: User interface for MyGPT. (A) MyGPT UI home screen. ",
            "distance": 0.93
        }
    ]
}
```


### Get conversation history

This endpoint will return the conversation history of the user. The response will be in JSON format.

The endpoint is:
```
GET /api/get_conversation_history/?dataset=GPCR
```

The response will be:

```json
{
    "conversations": [
        {
            "conversation_id": 6664,
            "questions_answers": [
                {
                    "question_id": 7547,
                    "question": "What kind of analysis can be performed using Survivorship portal?",
                    "relevance_score": 58.0
                }
            ]
        },
        {
            "conversation_id": 6299,
            "questions_answers": [
                {
                    "question_id": 7100,
                    "question": "How many people participated in SJLife cohort? ",
                    "relevance_score": 41.0
                }
            ]
        },
	]
}
```

### Frontend settings

This endpoint will return the frontend settings. The response will be in JSON format.

The endpoint is:
```
GET /api/frontend_settings/
```

The response will be:

```json
{
    "show_no_context_switch": true,
    "restriction_without_login": true,
    "azure_login": true,
    "django_login": false,
    "disable_chat_without_login": false
}
```

Here are the details of the settings:

- `show_no_context_switch`: If true, the user can switch between RAG vs direct chat with LLM like ChatGPT.
- `restriction_without_login`: If true, the user can't upload documents without logging in.
- `azure_login`: If true, the user can login using Azure/Microsoft single sign-on (SSO).
- `django_login`: If true, the user can login using Django authentication, which must be maintained sepretly by admin.
- `disable_chat_without_login`: If true, the user can't chat with LLM without logging in.