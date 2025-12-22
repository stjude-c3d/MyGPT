from sentence_transformers import CrossEncoder

def rerank_sources(sources, question_text):
    # rerank the sources based on vector score + bm25 score using cross encoder
    # cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    cross_encoder = CrossEncoder('cross-encoder/qnli-electra-base')

    reranked_sources = []
    for source in sources:
        source_text = source['context']
        score = cross_encoder.predict([[question_text, source_text]])[0]
        score_rounded = round(float(score), 3)
        source['reranked_score'] = score_rounded
        if score_rounded > 0.1:
            reranked_sources.append(source)
    
    # sort the sources based on the cross encoder score and combined score
    reranked_sources.sort(key=lambda x: x['reranked_score'], reverse=True)

    # add rank to each source
    for idx, source in enumerate(reranked_sources):
        source['rank'] = idx + 1

    # return the reranked sources
    return reranked_sources