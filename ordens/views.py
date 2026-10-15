from rest_framework import filters, viewsets, generics, status
from ordens.models import  OrdemServico
from ordens.serializer import OrdemServicoSerializer
from rest_framework.response import Response

class OrdemServicoViewSet(viewsets.ModelViewSet):
    queryset = OrdemServico.objects.all().order_by('-numero')
    serializer_class = OrdemServicoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['cliente_nome', 'equipamento', 'numero_serie']