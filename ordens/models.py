from django.db import models

class OrdemServico(models.Model):
    STATUS = (('A', 'Aberta'), ('E', 'Em andamento'), ('C', 'Concluída'), ('X', 'Cancelada'))
    PRIORIDADE = (('B', 'Baixa'), ('M', 'Média'), ('A', 'Alta'))

    numero = models.PositiveIntegerField(unique=True, editable=False)
    cliente_nome = models.CharField(max_length=80)
    cliente_telefone = models.CharField(max_length=20)
    cliente_documento = models.CharField(max_length=18, blank=True)
    equipamento = models.CharField(max_length=80)
    marca_modelo = models.CharField(max_length=80, blank=True)
    numero_serie = models.CharField(max_length=50, blank=True)
    defeito = models.TextField()
    acessorios = models.CharField(max_length=150, blank=True)
    tecnico = models.CharField(max_length=60, blank=True)
    prioridade = models.CharField(max_length=1, choices=PRIORIDADE, default='M')
    status = models.CharField(max_length=1, choices=STATUS, default='A')
    valor_estimado = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    previsao = models.DateField(null=True, blank=True)
    data_abertura = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.numero:
            ultimo = OrdemServico.objects.order_by('-numero').first()
            self.numero = (ultimo.numero + 1) if ultimo else 1
        super().save(*args, **kwargs)