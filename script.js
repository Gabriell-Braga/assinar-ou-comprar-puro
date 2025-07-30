let modeloElement;
let periodoElement;
let usoMensalElement;
let precoElement;
let parcelasElement;
let seguroElement;
let ipvaElement;
let licenciamentoElement;
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
let licenciamentoTotalElement;
let emplacamentoTotalElement;
let manutencaoTotalElement;
let manutencaoAnoTotalElement;
let depreciacaoTotalElement; // Elemento para depreciação total
let depreciacaoPrecoElement; // Elemento para preço de venda final
let custoOportunidadeFinanciadaTotalElement;
let custoOportunidadeVistaTotalElement;
let jurosTotalElement;
let jurosTaxaElement;
let entradaTotalElement;
let custoAssinaturaTotalElement;
let assinatura1_12TotalElement;
let custoOportunidadeAssinaturaTotalElement;
let precoTotalElement;
let baseCalculoElement;

let financiadaTotalElement;
let vistaTotalElement;
let assinaturaTotalElement;

let anbimaData = {};
let catalogData = {};

// Taxa de depreciação anual fixa (valor padrão, será ajustado em onFormChange)
const DEPRECIACAO_ANUAL_RATE_DEFAULT = 0.15; 
const DEPRECIACAO_ANUAL_RATE_LONGER_PERIOD = 0.10; // 10% para períodos > 12 meses

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

function populateModelSelect() {
    if (modeloElement && catalogData && catalogData.items) {
        $(modeloElement).empty();
        $(modeloElement).append('<option value="">Selecione um modelo</option>');

        const item = catalogData.items; 
        
        if (typeof item === 'object' && item !== null && item.title && item.title.rendered && item.slug) {
            const option = document.createElement('option');
            option.value = item.slug;
            option.textContent = item.title.rendered;
            modeloElement.appendChild(option);
        } else {
            console.warn('Estrutura de item do catálogo inesperada:', item);
        }
        console.log('Select de modelos populado.');
    } else {
        console.warn('Elemento modelo ou dados do catálogo não disponíveis para popular o select.');
    }
}

// IR aliquots based on months
const irAliquots = [
    { months: 6, aliquot: 0.2250 }, // Up to 6 months (180 days)
    { months: 12, aliquot: 0.20 }, // 7 to 12 months (181 to 360 days)
    { months: 24, aliquot: 0.1750 }, // 13 to 24 months (361 to 720 days)
    { months: Infinity, aliquot: 0.15 } // 24+ months (over 720 days)
];

function getIRAliquot(months) {
    for (const rule of irAliquots) {
        if (months <= rule.months) {
            return rule.aliquot;
        }
    }
    return 0; // Should not happen if Infinity is the last rule
}

function createJurosCurveTable() {
    const jurosCurve = [];
    if (!anbimaData || Object.keys(anbimaData).length === 0) {
        console.warn('Dados da ANBIMA não carregados para criar a curva de juros.');
        return []; // Retorna um array vazio se os dados não estiverem disponíveis
    }

    // Usar os valores completos da ANBIMA sem arredondamento para o cálculo da tabela
    const beta1 = anbimaData.beta1;
    const beta2 = anbimaData.beta2;
    const beta3 = anbimaData.beta3;
    const beta4 = anbimaData.beta4;
    const lambda1 = anbimaData.lambda1;
    const lambda2 = anbimaData.lambda2;

    // Custo de corretagem médio mensal (0,04% a.m.)
    const custoCorretagemMensal = 0.000416; // 0.04% / 100

    for (let month = 1; month <= 36; month++) {
        const periodYears = month / 12;
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
        const taxaBrutaAoPeriodo = Math.pow(1 + yieldMonthly, month) - 1;
        
        const irAliquot = getIRAliquot(month);
        // Calcula a taxa líquida ao período, subtraindo o custo de corretagem acumulado
        // A taxa líquida é a taxa bruta menos o IR e o custo de corretagem
        const taxaLiquidaAoPeriodo = (1 - irAliquot) * (taxaBrutaAoPeriodo - custoCorretagemMensal);

        jurosCurve.push({
            "Mês": month,
            // Formatando as porcentagens para ter no mínimo 2 e no máximo 4 casas decimais
            "Taxa Bruta ao ano": `${(yieldAnnual * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
            "Taxa Bruta ao período": `${(taxaBrutaAoPeriodo * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
            "Taxa Líquida ao período": `${(taxaLiquidaAoPeriodo * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`
        });
    }
    // console.log('Curva de Juros (ANBIMA):'); // Comentado para evitar log excessivo no console
    // console.table(jurosCurve); // Comentado para evitar log excessivo no console
    return jurosCurve; // Retorna o array da curva de juros
}


$(document).ready(function() {
    console.log('Script carregado com sucesso!');

    fetchApiData().then(() => {
        populateModelSelect();
        createJurosCurveTable(); // Chama a função para criar a tabela de juros
        onFormChange();
    });

    modeloElement = document.getElementById('modelo');
    periodoElement = document.getElementById('periodo');
    usoMensalElement = document.getElementById('uso_mensal');
    precoElement = document.getElementById('preco');
    parcelasElement = document.getElementById('parcelas');
    seguroElement = document.getElementById('seguro');
    ipvaElement = document.getElementById('ipva');
    licenciamentoElement = document.getElementById('licenciamento');
    emplacamentoElement = document.getElementById('emplacamento');
    manutencaoElement = document.getElementById('manutencao');
    entradaElement = document.getElementById('entrada');
    taxaAMElement = document.getElementById('taxa_am');

    periodoTotalElement = $('[data-total="periodo"]');
    seguroTotalElement = $('[data-total="seguro"]');
    ipvaTotalElement = $('[data-total="ipva"]');
    licenciamentoTotalElement = $('[data-total="licenciamento"]');
    emplacamentoTotalElement = $('[data-total="emplacamento"]');
    manutencaoTotalElement = $('[data-total="manutencao"]');
    manutencaoAnoTotalElement = $('[data-total="manutencao_ano"]');
    depreciacaoTotalElement = $('[data-total="depreciacao"]'); // Inicializa o elemento
    depreciacaoPrecoElement = $('[data-total="depreciacao_preco"]'); // Inicializa o novo elemento
    custoOportunidadeFinanciadaTotalElement = $('[data-total="custo_oportunidade_financiada"]');
    custoOportunidadeVistaTotalElement = $('[data-total="custo_oportunidade_vista"]');
    jurosTotalElement = $('[data-total="juros"]');
    jurosTaxaElement = $('[data-total="juros_taxa"]');
    entradaTotalElement = $('[data-total="entrada"]');
    custoAssinaturaTotalElement = $('[data-total="custo_assinatura"]');
    assinatura1_12TotalElement = $('[data-total="assinatura_1_12"]');
    custoOportunidadeAssinaturaTotalElement = $('[data-total="custo_oportunidade_assinatura"]');
    precoTotalElement = $('[data-total="preco"]');
    baseCalculoElement = $('[data-total="base_calculo"]');

    financiadaTotalElement = $('[data-total="financiada"]');
    vistaTotalElement = $('[data-total="vista"]');
    assinaturaTotalElement = $('[data-total="assinatura"]');

    $('#basic-form').on('submit', function(event) {
        event.preventDefault();
        if (this.checkValidity()) {
            const formData = {
                modelo: $('#modelo').val(),
                periodo: $('#periodo').val(),
                uso_mensal: $('#uso_mensal').val(),
                preco: $('#preco').val()
            };
            onFormChange();
            $('#step-2').removeClass('hidden');
            $('html, body').animate({
                scrollTop: $('#step-2').offset().top
            }, 1000);
        } else {
            console.log('Formulário inválido!');
        }
    });

    $('#complementary-form').on('submit', function(event) {
        event.preventDefault();
        if (this.checkValidity()) {
            $('#result').removeClass('hidden');
            onFormChange();
            $('html, body').animate({
                scrollTop: $('#result').offset().top
            }, 1000);
        } else {
            console.log('Formulário complementar inválido!');
        }
    });

    setupInputFormatting();
});

function formatCurrency(value) {
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercentage(value) {
    return `${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function parseCurrencyToFloat(currencyString) {
    return parseFloat(currencyString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

function parsePercentageToFloat(percentageString) {
    return parseFloat(percentageString.replace('%', '').replace(',', '.').trim());
}

function calculateOpportunityCost(scenarioType, principalValue, period, anbimaData, allCalculatedValues, annualFinancialDetails) {
    let totalOpportunityCost = 0;
    const jurosCurve = createJurosCurveTable(); // Pega a curva de juros

    if (!anbimaData || Object.keys(anbimaData).length === 0 || period <= 0 || !jurosCurve || jurosCurve.length === 0) {
        console.warn('Dados insuficientes para calcular Custo de Oportunidade.');
        return 0;
    }

    const { manutencao, emplacamentoValue, parcelaMensal, parcelas, usoMensal } = allCalculatedValues;

    console.group(`Custo de Oportunidade - Cenário: ${scenarioType.toUpperCase()}`);
    for (let month = 1; month <= period; month++) {
        let cashOutflowThisMonth = 0;

        // Encontra a Taxa Líquida ao Período para o período restante
        const remainingPeriod = period - (month - 1); // Ex: Mês 1 -> período total; Mês 2 -> período total - 1
        const remainingPeriodLiquidRateData = jurosCurve.find(item => item["Mês"] === remainingPeriod);
        
        if (!remainingPeriodLiquidRateData) {
            console.warn(`Taxa Líquida ao período não encontrada para o período restante (${remainingPeriod} meses) no mês ${month}.`);
            continue;
        }
        const remainingPeriodLiquidRate = parsePercentageToFloat(remainingPeriodLiquidRateData["Taxa Líquida ao período"]) / 100;

        const currentYearIndex = Math.floor((month - 1) / 12); // 0 for months 1-12, 1 for 13-24, etc.
        const firstMonthOfYear = (month - 1) % 12 === 0; // True for month 1, 13, 25...

        if (scenarioType === 'vista') {
            if (month === 1) {
                cashOutflowThisMonth += principalValue; // Valor do carro
                cashOutflowThisMonth += emplacamentoValue; // Emplacamento é só no primeiro mês
            }
            cashOutflowThisMonth += manutencao; // Manutenção mensal
            
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
            
        } else if (scenarioType === 'financiada') {
            if (month === 1) {
                cashOutflowThisMonth += principalValue; // Entrada
                cashOutflowThisMonth += emplacamentoValue; // Emplacamento é só no primeiro mês
            }
            cashOutflowThisMonth += parcelaMensal; // Parcela mensal do financiamento
            cashOutflowThisMonth += manutencao;
            
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
            
        } else if (scenarioType === 'assinatura') {
            cashOutflowThisMonth += parcelas; // Valor da parcela da assinatura (já é mensal)
        }
        
        const monthlyOpportunityCost = cashOutflowThisMonth * remainingPeriodLiquidRate;
        totalOpportunityCost += monthlyOpportunityCost;

        console.log(`Mês ${month}:`);
        console.log(`  Saída de Caixa (Fluxo): ${formatCurrency(cashOutflowThisMonth)}`);
        console.log(`  Taxa Líquida ao Período Restante (${remainingPeriod} meses): ${(remainingPeriodLiquidRate * 100).toFixed(4).replace('.', ',')}%`);
        console.log(`  Custo de Oportunidade Mensal: ${formatCurrency(monthlyOpportunityCost)}`);
    }
    console.groupEnd();
    return totalOpportunityCost;
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

function setupInputFormatting() {
    // Inputs de moeda
    $('[data-type="currency"]').each(function() {
        const $input = $(this);

        // Formata o valor inicial ao carregar a página
        if ($input.val()) {
            $input.val(formatCurrency(parseCurrencyToFloat($input.val())));
        }

        $input.on('input', function() {
            let value = $input.val();
            value = value.replace(/\D/g, ''); // Remove tudo que não for dígito

            if (value.length === 0) {
                $input.val('');
                return;
            }

            let numericValue = parseInt(value, 10);
            let floatValue = numericValue / 100;

            $input.val(formatCurrency(floatValue));
        });

        $input.on('blur', function() {
            const rawValue = $input.val();
            if (!rawValue || parseCurrencyToFloat(rawValue) === 0) {
                $input.val(formatCurrency(0));
            } else {
                $input.val(formatCurrency(parseCurrencyToFloat(rawValue)));
            }
        });
    });

    // Inputs de porcentagem
    $('[data-type="percentage"]').each(function() {
        const $input = $(this);

        // Formata o valor inicial ao carregar a página
        if ($input.val()) {
            $input.val(formatPercentage(parsePercentageToFloat($input.val())));
        }

        $input.on('input', function() {
            let value = $input.val();
            value = value.replace(/\D/g, ''); // Remove tudo que não for dígito

            if (value.length === 0) {
                $input.val('');
                return;
            }

            let numericValue = parseInt(value, 10);
            let floatValue = numericValue / 100;

            $input.val(formatPercentage(floatValue));
        });

        $input.on('blur', function() {
            const rawValue = $input.val();
            if (!rawValue || parsePercentageToFloat(rawValue) === 0) {
                $input.val(formatPercentage(0));
            } else {
                $input.val(formatPercentage(parsePercentageToFloat(rawValue)));
            }
        });
    });
}


function onFormChange(){
    const preco = parseCurrencyToFloat(precoElement.value);
    const periodo = parseFloat(periodoElement.value);
    const seguroPercentage = parsePercentageToFloat(seguroElement.value);
    const ipvaPercentage = parsePercentageToFloat(ipvaElement.value);
    const manutencao = parseCurrencyToFloat(manutencaoElement.value);
    const entradaPercentage = parsePercentageToFloat(entradaElement.value);
    const taxaAM = parsePercentageToFloat(taxaAMElement.value);
    const licenciamentoValue = parseCurrencyToFloat(licenciamentoElement.value);
    const emplacamentoValue = parseCurrencyToFloat(emplacamentoElement.value);
    const parcelas = parseCurrencyToFloat(parcelasElement.value);
    const usoMensal = parseCurrencyToFloat(usoMensalElement.value); // Adicionado usoMensal

    // --- Cálculo da Depreciação e Custos Anuais (Seguro, IPVA, Licenciamento) ---
    let currentCarValueForDepreciation = preco;
    let totalDepreciacaoCalculated = 0;
    let totalSeguroPeriodo = 0;
    let totalIpvaPeriodo = 0;
    let totalLicenciamentoPeriodo = 0;
    let annualFinancialDetails = []; // Para armazenar os detalhes financeiros de cada ano

    const fullYearsInPeriod = Math.floor(periodo / 12);
    const remainingMonthsInPartialYear = periodo % 12;

    console.group('Depreciação Anual e Valor do Carro');
    console.log(`Valor inicial do carro: ${formatCurrency(preco)}`);

    for (let year = 0; year < fullYearsInPeriod; year++) {
        // Custos anuais baseados no valor do carro no início do ano
        const annualSeguroThisYear = seguroPercentage * currentCarValueForDepreciation / 100;
        const annualIpvaThisYear = ipvaPercentage * currentCarValueForDepreciation / 100;
        const annualLicenciamentoThisYear = licenciamentoValue; // Licenciamento é um valor anual fixo

        totalSeguroPeriodo += annualSeguroThisYear;
        totalIpvaPeriodo += annualIpvaThisYear;
        totalLicenciamentoPeriodo += annualLicenciamentoThisYear;

        // Depreciação para este ano completo
        const depreciationRateForThisYear = (year === 0) ? DEPRECIACAO_ANUAL_RATE_DEFAULT : DEPRECIACAO_ANUAL_RATE_LONGER_PERIOD;
        const depreciationAmountThisYear = currentCarValueForDepreciation * depreciationRateForThisYear;
        
        totalDepreciacaoCalculated += depreciationAmountThisYear;
        currentCarValueForDepreciation -= depreciationAmountThisYear;

        // Armazena os detalhes financeiros para este ano
        annualFinancialDetails.push({
            year: year + 1,
            startOfYearCarValue: preco - totalDepreciacaoCalculated, // Valor do carro após depreciação acumulada até o final do ano anterior
            annualSeguro: annualSeguroThisYear,
            annualIpva: annualIpvaThisYear,
            annualLicenciamento: annualLicenciamentoThisYear,
            depreciationAmount: depreciationAmountThisYear
        });

        // Log do valor do carro ao final de cada ano
        console.log(`Fim do Ano ${year + 1}: Valor do carro = ${formatCurrency(currentCarValueForDepreciation)}`);
    }

    // Lida com o ano parcial restante, se houver
    if (remainingMonthsInPartialYear > 0) {
        const monthsFraction = remainingMonthsInPartialYear / 12;

        // Custos para este ano parcial
        const annualSeguroThisPartialYear = seguroPercentage * currentCarValueForDepreciation / 100;
        const annualIpvaThisPartialYear = ipvaPercentage * currentCarValueForDepreciation / 100;
        const annualLicenciamentoThisPartialYear = licenciamentoValue;

        totalSeguroPeriodo += annualSeguroThisPartialYear * monthsFraction;
        totalIpvaPeriodo += annualIpvaThisPartialYear * monthsFraction;
        totalLicenciamentoPeriodo += annualLicenciamentoThisPartialYear * monthsFraction;

        // Depreciação para este ano parcial
        const depreciationRateForPartialYear = (fullYearsInPeriod === 0) ? DEPRECIACAO_ANUAL_RATE_DEFAULT : DEPRECIACAO_ANUAL_RATE_LONGER_PERIOD;
        const depreciationAmountThisPartialYear = currentCarValueForDepreciation * depreciationRateForPartialYear * monthsFraction;
        
        totalDepreciacaoCalculated += depreciationAmountThisPartialYear;
        currentCarValueForDepreciation -= depreciationAmountThisPartialYear;

        // Armazena os detalhes financeiros para este ano parcial
        annualFinancialDetails.push({
            year: fullYearsInPeriod + 1,
            startOfYearCarValue: preco - totalDepreciacaoCalculated, // Valor do carro após depreciação acumulada até o final do ano anterior
            annualSeguro: annualSeguroThisPartialYear,
            annualIpva: annualIpvaThisPartialYear,
            annualLicenciamento: annualLicenciamentoThisPartialYear,
            depreciationAmount: depreciationAmountThisPartialYear
        });

        // Log do valor do carro ao final do período parcial
        console.log(`Fim do Período (após ${periodo} meses): Valor do carro = ${formatCurrency(currentCarValueForDepreciation)}`);
    } else if (fullYearsInPeriod === 0 && periodo === 0) {
        // Caso o período seja 0 meses, o valor final é o inicial
        console.log(`Fim do Período (após ${periodo} meses): Valor do carro = ${formatCurrency(currentCarValueForDepreciation)}`);
    }
    console.groupEnd();

    const depreciacaoPrecoFinal = preco - totalDepreciacaoCalculated;

    // --- Atribui aos totais globais para exibição e outros cálculos ---
    seguroTotal = totalSeguroPeriodo;
    ipvaTotal = totalIpvaPeriodo;
    manutencaoTotal = manutencao * periodo; // Manutenção total ao longo do período (manutencao é mensal)
    
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
    
    const assinaturaTotal = parcelas * periodo;

    // Objeto com todos os valores calculados para passar para a função de custo de oportunidade
    const allCalculatedValuesForOpportunityCost = {
        seguroTotal: seguroTotal, // Total acumulado para o período
        ipvaTotal: ipvaTotal,     // Total acumulado para o período
        manutencao: manutencao,   // Manutenção mensal
        licenciamentoValue: licenciamentoValue, // Valor anual do licenciamento
        emplacamentoValue: emplacamentoValue, // Valor único do emplacamento
        parcelaMensal: parcelaMensal,
        parcelas: parcelas, // Parcela mensal da assinatura
        usoMensal: usoMensal // Uso mensal
    };

    const custoOportunidadeFinanciada = calculateOpportunityCost('financiada', entradaTotal, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeVista = calculateOpportunityCost('vista', preco, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeAssinatura = calculateOpportunityCost('assinatura', null, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);

    periodoTotalElement.text(`${periodo}`);
    seguroTotalElement.text(formatCurrency(seguroTotal));
    ipvaTotalElement.text(formatCurrency(ipvaTotal));
    licenciamentoTotalElement.text(formatCurrency(totalLicenciamentoPeriodo)); // Exibe o total de licenciamento no período
    emplacamentoTotalElement.text(formatCurrency(emplacamentoValue));
    manutencaoAnoTotalElement.text(formatCurrency(manutencao)); // Exibe a manutenção mensal
    manutencaoTotalElement.text(formatCurrency(manutencao * periodo)); // Total da manutenção no período
    depreciacaoTotalElement.text(formatCurrency(totalDepreciacaoCalculated)); // Exibe depreciação total
    depreciacaoPrecoElement.text(formatCurrency(depreciacaoPrecoFinal)); // Exibe preço final após depreciação
    entradaTotalElement.text(formatCurrency(entradaTotal));

    jurosTotalElement.text(formatCurrency(jurosTotal));
    jurosTaxaElement.text(`${taxaAM.toFixed(2).replace('.', ',')}%`);

    custoAssinaturaTotalElement.text(formatCurrency(assinaturaTotal));
    assinatura1_12TotalElement.text(formatCurrency(parcelas));
    precoTotalElement.text(formatCurrency(preco));

    custoOportunidadeFinanciadaTotalElement.text(formatCurrency(custoOportunidadeFinanciada));
    custoOportunidadeVistaTotalElement.text(formatCurrency(custoOportunidadeVista));
    custoOportunidadeAssinaturaTotalElement.text(formatCurrency(custoOportunidadeAssinatura));

    // Adicionando a depreciação ao valor total da compra financiada
    const financiadaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue + jurosTotal + custoOportunidadeFinanciada + totalDepreciacaoCalculated;
    financiadaTotalElement.text(formatCurrency(financiadaCalcTotal));

    // Adicionando a depreciação ao valor total da compra à vista
    const vistaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue + custoOportunidadeVista + totalDepreciacaoCalculated;
    vistaTotalElement.text(formatCurrency(vistaCalcTotal));

    assinaturaTotalElement.text(formatCurrency(assinaturaTotal + custoOportunidadeAssinatura));

    if (anbimaData && Object.keys(anbimaData).length > 0) {
        const formattedAnbima = `beta1: ${anbimaData.beta1.toFixed(4).replace('.', ',')} | beta2: ${anbimaData.beta2.toFixed(4).replace('.', ',')} | beta3: ${anbimaData.beta3.toFixed(4).replace('.', ',')} | beta4: ${anbimaData.beta4.toFixed(4).replace('.', ',')} | lambda1: ${anbimaData.lambda1.toFixed(4).replace('.', ',')} | lambda2: ${anbimaData.lambda2.toFixed(4).replace('.', ',')}`;
        baseCalculoElement.text(formattedAnbima);
    }

    console.log('--- Totais Atuais (para depuração) ---');
    console.log(`Preço: ${preco}`);
    console.log(`Período: ${periodo}`);
    console.log(`Seguro Total (Período): ${seguroTotal}`);
    console.log(`IPVA Total (Período): ${ipvaTotal}`);
    console.log(`Manutenção Total (Período): ${manutencaoTotal}`);
    console.log(`Depreciação Total: ${totalDepreciacaoCalculated}`);
    console.log(`Preço Final Após Depreciação: ${depreciacaoPrecoFinal}`);
    console.log(`Entrada Total: ${entradaTotal}`);
    console.log(`Taxa A.M.: ${taxaAM}`);
    console.log(`Valor Financiado: ${valorFinanciado}`);
    console.log(`Parcela Mensal (com juros): ${parcelaMensal}`);
    console.log(`Juros Total: ${jurosTotal}`);
    console.log(`Licenciamento Total (Período): ${totalLicenciamentoPeriodo}`);
    console.log(`Emplacamento: ${emplacamentoValue}`);
    console.log(`Custo de Oportunidade Financiada: ${custoOportunidadeFinanciada}`);
    console.log(`Custo de Oportunidade à Vista: ${custoOportunidadeVista}`);
    console.log(`Custo Rentabilidade Assinatura: ${custoOportunidadeAssinatura}`);
    console.log(`Financiada Total (Calculado): ${financiadaCalcTotal}`);
    console.log('Dados ANBIMA carregados:', anbimaData);
    console.log('Dados do Catálogo carregados:', catalogData);

    updateChartHeights();
}
