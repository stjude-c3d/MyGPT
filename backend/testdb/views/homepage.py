from django.shortcuts import render
from ..models import Dataset, EmbeddingModel, RerankerModel

def home(request):
    datasets = Dataset.objects.all()

    # check if nomic embedding model exists
    nomic_model = EmbeddingModel.objects.filter(model_name='nomic-embed-text:latest').first()
    if not nomic_model:
        nomic_model = EmbeddingModel(
            model_name='nomic-embed-text:latest',
            model_size=0.27,
            model_source='ollama',
            best_distance_q=73.323,
            worst_distance_q=344.086,
            best_distance_ac=39.767,
            worst_distance_ac=288.555,
            best_distance_nac=266.08,
            worst_distance_nac=158.389
        )
        nomic_model.save()

    # create reranker model if not exists
    defaul_rerankers = [
        {'model_name': 'cross-encoder/qnli-electra-base', 'cutoff_score': 0.1},
        {'model_name': 'cross-encoder/nli-deberta-v3-base', 'cutoff_score': 0.0},
        {'model_name': 'zeroentropy/zerank-2', 'cutoff_score': 0.3 },
    ]

    for reranker in defaul_rerankers:
        existing_reranker = RerankerModel.objects.filter(model_name=reranker['model_name']).first()
        if not existing_reranker:
            new_reranker = RerankerModel(
                model_name=reranker['model_name'],
                cutoff_score=reranker['cutoff_score']
            )
            new_reranker.save()

    return render(request, 'home.html', {'datasets': datasets})