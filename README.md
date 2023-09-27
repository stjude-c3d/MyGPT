# PubGPT

Llamology: Llama2-FAISS Pipeline For Context-Based QA
To get weights, cd into Llamology/models and run the following:
wget https://huggingface.co/TheBloke/Llama-2-13B-chat-GGML/resolve/main/llama-2-13b-chat.ggmlv3.q4_1.bin

When the weights are downloaded, rename the weights bin to llama-2-chat-ggml-model.bin.

## Pipeline

<img src='./pipeline.png' width='800px' alt='pipeline to query pdf'>

Source: [Llamology: Llama2-FAISS Pipeline For Context-Based QA](https://towardsdatascience.com/running-llama-2-on-cpu-inference-for-document-q-a-3d636037a3d8)

## Performance

Here is example of outout from the backend API and performance of the `Llama-2-13b-chat` model on Macbook Pro M1 Max with 8 cores and 32 GB RAM:

### Example 1

Question:  What is function of IDR protein family?

```log
llama_print_timings:        load time = 151544.28 ms
llama_print_timings:      sample time =    53.54 ms /   113 runs   (    0.47 ms per token,  2110.49 tokens per second)
llama_print_timings: prompt eval time = 356653.43 ms /  1359 tokens (  262.44 ms per token,     3.81 tokens per second)
llama_print_timings:        eval time = 35502.97 ms /   112 runs   (  316.99 ms per token,     3.15 tokens per second)
llama_print_timings:       total time = 392379.12 ms
```

Llama:  Based on the information found on page 1.0 of "Intrinsically Disordered Regions Promote Protein Refoldability and Facilitate Retrieval from Biomolecular Condensates", The function of IDRs is to render their host proteins more refoldable from a denatured state, allowing them to cohere more closely to Anfinsen's thermodynamic hypothesis. This allows almost all yeast proteins that partition into stress granules during heat shock to be refoldable, and also helps the Hsp104 unfoldase mediate disassembly of heat stress granules. Overall, these studies establish spontaneous refoldability as an adaptive trait for many multidomain proteins. 

BioGPT-ft:   IDRs are functional protein domains that lack a well-defined 3D structure. They are abundant throughout the proteome, especially in proteins associated with regulatory, signaling, and recognition functions. 


### Example 2

Question:  How GeneGPT can be used by biologists?

```log
llama_print_timings:        load time = 151544.28 ms
llama_print_timings:      sample time =    54.09 ms /   114 runs   (    0.47 ms per token,  2107.60 tokens per second)
llama_print_timings: prompt eval time = 471394.33 ms /  1778 tokens (  265.13 ms per token,     3.77 tokens per second)
llama_print_timings:        eval time = 37732.54 ms /   113 runs   (  333.92 ms per token,     2.99 tokens per second)
llama_print_timings:       total time = 509354.64 ms
```

Llama:  Based on the information found on page 0.0 of "GeneGPT: Augmenting Large Language Models with Domain Tools for Improved Access to Biomedical Information", GeneGPT is a novel method that teaches large language models (LLMs) to use Web APIs from the National Center for Biotechnology Information (NCBI). It uses in-context learning and an augmented decoding algorithm to detect and execute API calls. GeneGPT can be used by biologists to improve their access to specialized knowledge in genomics, and it has been shown to achieve state-of-the-art performance on eight tasks in the GeneTuring benchmark with an average score of 0.83. 


BioGPT-ft:   GeneGPT is a web application for easy retrieval, analysis and visualization of gene family data. The web tool allows querying based on gene family name, accession number, sequence or functional domain and displays multiple sequence alignments for given gene families.