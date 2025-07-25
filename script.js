let modeloElement;
let periodoElement;
let usoMensalElement;
let precoElement;
let parcelasIniciaisElement;
let parcelasRestantesElement;
let seguroElement;
let ipvaElement;
let licenciamentoSeguroElement;
let emplacamentoElement;
let manutencaoElement;
let entradaElement;
let taxaAMElement;

// valores totais
let seguroTotal = 0;
let ipvaTotal = 0;
let manutencaoTotal = 0;
let jurosTotal = 0;
let entradaTotal = 0;
let parcelasTotal = 0;

//elementos para inserir valores totais
let periodoTotalElement;
let seguroTotalElement;
let ipvaTotalElement;
let licenciamentoSeguroTotalElement;
let emplacamentoTotalElement;
let manutencaoTotalElement;
let manutencaoMesElement;
let jurosTotalElement;
let jurosMesElement;
let entradaTotalElement;

//elementos para inserir totais gerais
let financiadaTotalElement;
let assinadaTotalElement;
let assinaturaTotalElement;

$(document).ready(function() {
    console.log('Script carregado com sucesso!');
    modeloElement = document.getElementById('modelo');
    periodoElement = document.getElementById('periodo');
    usoMensalElement = document.getElementById('uso_mensal');
    precoElement = document.getElementById('preco');
    parcelasIniciaisElement = document.getElementById('parcelas_iniciais');
    parcelasRestantesElement = document.getElementById('parcelas_restantes');
    seguroElement = document.getElementById('seguro');
    ipvaElement = document.getElementById('ipva');
    licenciamentoSeguroElement = document.getElementById('licenciamento_seguro');
    emplacamentoElement = document.getElementById('emplacamento');
    manutencaoElement = document.getElementById('manutencao');
    entradaElement = document.getElementById('entrada');
    taxaAMElement = document.getElementById('taxa_am');

    //elementos para inserir valores totais
    periodoTotalElement = $('[data-total="periodo"]');
    seguroTotalElement = $('[data-total="seguro"]');
    ipvaTotalElement = $('[data-total="ipva"]');
    licenciamentoSeguroTotalElement = $('[data-total="licenciamento_seguro"]');
    emplacamentoTotalElement = $('[data-total="emplacamento"]');
    manutencaoTotalElement = $('[data-total="manutencao"]');
    manutencaoMesElement = $('[data-total="manutencao_mes"]');
    jurosTotalElement = $('[data-total="juros"]');
    jurosMesElement = $('[data-total="juros_mes"]');
    entradaTotalElement = $('[data-total="entrada"]');

    //elementos para inserir totais gerais
    financiadaTotalElement = $('[data-total="financiada"]');
    assinadaTotalElement = $('[data-total="assinada"]');
    assinaturaTotalElement = $('[data-total="assinatura"]');

    // basic form submit listener
    $('#basic-form').on('submit', function(event) {
        event.preventDefault();        
        // Verifica se o formulário é válido
        if (this.checkValidity()) {
            console.log('Formulário válido!');
            const formData = {
                modelo: $('#modelo').val(),
                periodo: $('#periodo').val(),
                uso_mensal: $('#uso_mensal').val(),
                preco: $('#preco').val()
            };
            onFormChange();
            $('#step-2').removeClass('hidden');
        } else {
            console.log('Formulário inválido!');
        }
    });

    // complementary form submit listener
    $('#complementary-form').on('submit', function(event) {
        event.preventDefault();
        // Verifica se o formulário é válido
        if (this.checkValidity()) {
            console.log('Formulário complementar válido!');
            $('#result').removeClass('hidden');
        } else {
            console.log('Formulário complementar inválido!');
        }
    });
});

function onFormChange(){
    seguroTotal = seguroElement.value * precoElement.value / 100 ;
    ipvaTotal = ipvaElement.value * precoElement.value / 100;
    manutencaoTotal = manutencaoElement.value * periodoElement.value / 100;
    parcelasTotal = (precoElement.value - (precoElement.value * entradaElement.value / 100)) / periodoElement.value;
    jurosTotal = parcelasTotal * taxaAMElement.value / 100;
    entradaTotal = entradaElement.value * precoElement.value / 100;

    // Atualiza os valores totais
    periodoTotalElement.text(`${periodoElement.value}`);
    seguroTotalElement.text(`${seguroTotal.toFixed(2)}`);
    ipvaTotalElement.text(`${ipvaTotal.toFixed(2)}`);
    licenciamentoSeguroTotalElement.text(`${licenciamentoSeguroElement.value}`);
    emplacamentoTotalElement.text(`${emplacamentoElement.value}`);
    manutencaoMesElement.text(`${manutencaoElement.value}`);
    manutencaoTotalElement.text(`${manutencaoTotal.toFixed(2)}`);
    
    entradaTotalElement.text(`${entradaTotal.toFixed(2)}`);
}