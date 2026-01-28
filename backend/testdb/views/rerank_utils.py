from sentence_transformers import CrossEncoder

def rerank_sources(sources, question_text):
    # rerank the sources based on vector score + bm25 score using cross encoder
    # cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

    # check if model is available locally. if not, download and save it
    cross_encoder_path = '/code/data/reranker/cross_encoder_qnli_electra_base'
    try:
        cross_encoder = CrossEncoder(cross_encoder_path)
    except:
        cross_encoder = CrossEncoder('cross-encoder/qnli-electra-base')
        cross_encoder.save_pretrained('/code/data/reranker/cross_encoder_qnli_electra_base')

    RERANK_SCORE_THRESHOLD = 0.1

    # cross_encoder_path = '/code/data/reranker/zerank_2'
    # try:
    #     cross_encoder = CrossEncoder(cross_encoder_path)
    # except:
    #     cross_encoder = CrossEncoder('zeroentropy/zerank-2', trust_remote_code=True)
    #     cross_encoder.save_pretrained('/code/data/reranker/zerank_2')

    # RERANK_SCORE_THRESHOLD = 0.3

    reranked_sources = []
    for source in sources:
        source_text = source['context']
        score = cross_encoder.predict([[question_text, source_text]])[0]
        score_rounded = round(float(score), 3)
        source['reranked_score'] = score_rounded
        if score_rounded > RERANK_SCORE_THRESHOLD:
            reranked_sources.append(source)
    
    # sort the sources based on the cross encoder score and combined score
    reranked_sources.sort(key=lambda x: x['reranked_score'], reverse=True)

    # add rank to each source
    for idx, source in enumerate(reranked_sources):
        source['rank'] = idx + 1

    # return the reranked sources
    return reranked_sources

def rerank_answer_sources(sources, answer_text):
    # rerank the sources based on vector score + bm25 score using cross encoder

    # check if model is available locally. if not, download and save it
    cross_encoder_path = '/code/data/reranker/cross_encoder_nli_deberta_v3_base'
    try:
        cross_encoder = CrossEncoder(cross_encoder_path)
    except:
        cross_encoder = CrossEncoder('cross-encoder/nli-deberta-v3-base')
        cross_encoder.save_pretrained('/code/data/reranker/cross_encoder_nli_deberta_v3_base')

    reranked_scores = []
    for source in sources:
        scores = cross_encoder.predict([(answer_text, source)])
        label_mapping = ['contradiction', 'entailment', 'neutral']
        max_index = int(scores.argmax())
        label = [label_mapping[max_index]]
        # score_rounded = round(float(score), 3)
        reranked_scores.append(label)

    # return the reranked sources
    return reranked_scores