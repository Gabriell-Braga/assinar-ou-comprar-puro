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

let seguroTotal = 0;
let ipvaTotal = 0;
let manutencaoTotal = 0;
let jurosTotal = 0;
let entradaTotal = 0;
let parcelasTotal = 0;

let periodoTotalElement;
let seguroTotalElement;
let ipvaTotalElement;
let licenciamentoSeguroTotalElement;
let emplacamentoTotalElement;
let manutencaoTotalElement;
let manutencaoMesTotalElement;
let custoOportunidadeFinanciadaTotalElement;
let custoOportunidadeVistaTotalElement;
let jurosTotalElement;
let jurosTaxaElement;
let entradaTotalElement;
let custoAssinaturaTotalElement;
let assinatura1_8TotalElement;
let assinatura9_12TotalElement;

let financiadaTotalElement;
let vistaTotalElement; // Renomeado de assinadaTotalElement
let assinaturaTotalElement;

let anbimaData = {};
let catalogData = {};

async function fetchApiData() {
    const apiUrl = 'https://assinaroucomprar.listradigital.com.br/api/calculadora/catalog?period=12&franchise=1000';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        anbimaData = data.anbima;
        catalogData = data.catalog;
        console.log('Dados da ANBIMA e do Catálogo carregados:', { anbimaData, catalogData });
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
    }
}

$(document).ready(function() {
    console.log('Script carregado com sucesso!');

    fetchApiData().then(() => {
        onFormChange();
    });

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

    periodoTotalElement = $('[data-total="periodo"]');
    seguroTotalElement = $('[data-total="seguro"]');
    ipvaTotalElement = $('[data-total="ipva"]');
    licenciamentoSeguroTotalElement = $('[data-total="licenciamento_seguro"]');
    emplacamentoTotalElement = $('[data-total="emplacamento"]');
    manutencaoTotalElement = $('[data-total="manutencao"]');
    manutencaoMesTotalElement = $('[data-total="manutencao_mes"]');
    custoOportunidadeFinanciadaTotalElement = $('[data-total="custo_oportunidade_financiada"]');
    custoOportunidadeVistaTotalElement = $('[data-total="custo_oportunidade_vista"]');
    jurosTotalElement = $('[data-total="juros"]');
    jurosTaxaElement = $('[data-total="juros_taxa"]');
    entradaTotalElement = $('[data-total="entrada"]');
    custoAssinaturaTotalElement = $('[data-total="custo_assinatura"]');
    assinatura1_8TotalElement = $('[data-total="assinatura_1_8"]');
    assinatura9_12TotalElement = $('[data-total="assinatura_9_12"]');

    financiadaTotalElement = $('[data-total="financiada"]');
    vistaTotalElement = $('[data-total="vista"]'); // Renomeado
    assinaturaTotalElement = $('[data-total="assinatura"]');

    $('#basic-form').on('submit', function(event) {
        event.preventDefault();
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

    $('#complementary-form').on('submit', function(event) {
        event.preventDefault();
        if (this.checkValidity()) {
            console.log('Formulário complementar válido!');
            $('#result').removeClass('hidden');
        } else {
            console.log('Formulário complementar inválido!');
        }
    });
});

function formatCurrency(value) {
    // Usar toLocaleString para formatação de moeda brasileira (milhares com ponto, decimais com vírgula)
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseCurrencyToFloat(currencyString) {
    return parseFloat(currencyString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

function calculateOpportunityCost(principal, period, anbimaData) {
    let opportunityCost = 0;

    if (anbimaData && Object.keys(anbimaData).length > 0 && period > 0) {
        // Arredondar os dados da ANBIMA para duas casas decimais
        const beta1 = parseFloat(anbimaData.beta1.toFixed(2));
        const beta2 = parseFloat(anbimaData.beta2.toFixed(2));
        const beta3 = parseFloat(anbimaData.beta3.toFixed(2));
        const beta4 = parseFloat(anbimaData.beta4.toFixed(2));
        const lambda1 = parseFloat(anbimaData.lambda1.toFixed(2));
        const lambda2 = parseFloat(anbimaData.lambda2.toFixed(2));

        const periodYears = period / 12;
        let yieldAnnual = 0;
        if (periodYears > 0) {
            const term1 = (1 - Math.exp(-lambda1 * periodYears)) / (lambda1 * periodYears);
            const term2 = term1 - Math.exp(-lambda1 * periodYears);
            const term3 = (1 - Math.exp(-lambda2 * periodYears)) / (lambda2 * periodYears);
            const term4 = term3 - Math.exp(-lambda2 * periodYears);

            yieldAnnual = beta1 + beta2 * term1 + beta3 * term2 + beta4 * term4;
        } else {
            yieldAnnual = beta1 + beta2 + beta3 + beta4;
        }

        const yieldMonthly = Math.pow(1 + yieldAnnual, 1/12) - 1;

        opportunityCost = principal * (Math.pow(1 + yieldMonthly, period) - 1);
    } else {
        console.warn('Dados da ANBIMA não carregados ou período inválido para calcular Custo de Oportunidade.');
    }
    return opportunityCost;
}

function updateChartHeights() {
    const financiadaValue = parseCurrencyToFloat(financiadaTotalElement.text());
    const vistaValue = parseCurrencyToFloat(vistaTotalElement.text());
    const assinaturaValue = parseCurrencyToFloat(assinaturaTotalElement.text());

    const maxValue = Math.max(financiadaValue, vistaValue, assinaturaValue);

    if (maxValue === 0) {
        $('#chart-financiada').css('height', '0%');
        $('#chart-vista').css('height', '0%');
        $('#chart-assinatura').css('height', '0%');
        return;
    }

    const financiadaHeight = (financiadaValue / maxValue) * 100;
    const vistaHeight = (vistaValue / maxValue) * 100;
    const assinaturaHeight = (assinaturaValue / maxValue) * 100;

    $('#chart-financiada').css('height', `${financiadaHeight}%`);
    $('#chart-vista').css('height', `${vistaHeight}%`);
    $('#chart-assinatura').css('height', `${assinaturaHeight}%`);

    console.log('Alturas dos gráficos atualizadas:', {
        financiada: `${financiadaHeight}%`,
        vista: `${vistaHeight}%`,
        assinatura: `${assinaturaHeight}%`
    });
}


function onFormChange(){
    const preco = parseFloat(precoElement.value);
    const periodo = parseFloat(periodoElement.value);
    const seguroPercentage = parseFloat(seguroElement.value);
    const ipvaPercentage = parseFloat(ipvaElement.value);
    const manutencaoMonthly = parseFloat(manutencaoElement.value);
    const entradaPercentage = parseFloat(entradaElement.value);
    const taxaAM = parseFloat(taxaAMElement.value);
    const licenciamentoSeguroValue = parseFloat(licenciamentoSeguroElement.value);
    const emplacamentoValue = parseFloat(emplacamentoElement.value);
    const parcelasIniciais = parseFloat(parcelasIniciaisElement.value);
    const parcelasRestantes = parseFloat(parcelasRestantesElement.value);

    seguroTotal = seguroPercentage * preco / 100;
    ipvaTotal = ipvaPercentage * preco / 100;
    manutencaoTotal = manutencaoMonthly * periodo;
    entradaTotal = entradaPercentage * preco / 100;

    const valorFinanciado = preco - entradaTotal;
    
    const taxaMensalDecimal = taxaAM / 100;
    let parcelaMensal = 0;

    if (taxaMensalDecimal > 0) {
        parcelaMensal = valorFinanciado * (taxaMensalDecimal * Math.pow((1 + taxaMensalDecimal), periodo)) / (Math.pow((1 + taxaMensalDecimal), periodo) - 1);
    } else {
        parcelaMensal = valorFinanciado / periodo;
    }

    const totalPagoComJuros = parcelaMensal * periodo;
    jurosTotal = totalPagoComJuros - valorFinanciado;
    
    parcelasTotal = parcelaMensal; 

    const custoOportunidadeFinanciada = calculateOpportunityCost(entradaTotal, periodo, anbimaData);
    const custoOportunidadeVista = calculateOpportunityCost(preco, periodo, anbimaData);

    periodoTotalElement.text(`${periodo}`);
    seguroTotalElement.text(formatCurrency(seguroTotal));
    ipvaTotalElement.text(formatCurrency(ipvaTotal));
    licenciamentoSeguroTotalElement.text(formatCurrency(licenciamentoSeguroValue));
    emplacamentoTotalElement.text(formatCurrency(emplacamentoValue));
    manutencaoMesTotalElement.text(formatCurrency(manutencaoMonthly));
    manutencaoTotalElement.text(formatCurrency(manutencaoTotal));
    entradaTotalElement.text(formatCurrency(entradaTotal));

    jurosTotalElement.text(formatCurrency(jurosTotal));
    jurosTaxaElement.text(`${taxaAM}%`); // Mantido como taxa percentual

    custoAssinaturaTotalElement.text(formatCurrency(parcelasIniciais * 8 + parcelasRestantes * 4));
    assinatura1_8TotalElement.text(formatCurrency(parcelasIniciais));
    assinatura9_12TotalElement.text(formatCurrency(parcelasRestantes));

    custoOportunidadeFinanciadaTotalElement.text(formatCurrency(custoOportunidadeFinanciada));
    custoOportunidadeVistaTotalElement.text(formatCurrency(custoOportunidadeVista));

    const financiadaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + licenciamentoSeguroValue + emplacamentoValue + jurosTotal + custoOportunidadeFinanciada;
    financiadaTotalElement.text(formatCurrency(financiadaCalcTotal));

    const vistaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + licenciamentoSeguroValue + emplacamentoValue + custoOportunidadeVista;
    vistaTotalElement.text(formatCurrency(vistaCalcTotal));

    assinaturaTotalElement.text(formatCurrency(parcelasIniciais * 8 + parcelasRestantes * 4));

    console.log('--- Totais Atuais (para depuração) ---');
    console.log(`Preço: ${preco}`);
    console.log(`Período: ${periodo}`);
    console.log(`Seguro Total: ${seguroTotal}`);
    console.log(`IPVA Total: ${ipvaTotal}`);
    console.log(`Manutenção Total: ${manutencaoTotal}`);
    console.log(`Entrada Total: ${entradaTotal}`);
    console.log(`Taxa A.M.: ${taxaAM}`);
    console.log(`Valor Financiado: ${valorFinanciado}`);
    console.log(`Parcela Mensal (com juros): ${parcelaMensal}`);
    console.log(`Juros Total: ${jurosTotal}`);
    console.log(`Licenciamento Seguro: ${licenciamentoSeguroValue}`);
    console.log(`Emplacamento: ${emplacamentoValue}`);
    console.log(`Custo de Oportunidade Financiada: ${custoOportunidadeFinanciada}`);
    console.log(`Custo de Oportunidade à Vista: ${custoOportunidadeVista}`);
    console.log(`Financiada Total (Calculado): ${financiadaCalcTotal}`);
    console.log('Dados ANBIMA carregados:', anbimaData);
    console.log('Dados do Catálogo carregados:', catalogData);

    updateChartHeights();
}
