from rest_framework import serializers
from ordens.models import OrdemServico

class OrdemServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = '__all__'
        read_only_fields = ['numero', 'data_abertura']

