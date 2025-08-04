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
let depreciacaoTotalElement;
let depreciacaoPrecoElement;
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

let anbimaData = {};
let catalogData = {};

// Taxa de depreciação anual
let DEPRECIACAO_ANUAL_RATE_DEFAULT = 0.15; 
const DEPRECIACAO_ANUAL_RATE_LONGER_PERIOD = 0.10;

async function fetchApiData() {
    const apiUrl = 'https://assinaroucomprar.listradigital.com.br/api/calculadora/catalog?period=12&franchise=1000';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        anbimaData = data.anbima;
        console.log('Dados da ANBIMA carregados.');
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
    }
}

async function fetchFipePrice(fipeCode, year) {
    const fipeApiUrl = `https://fipe.parallelum.com.br/api/v2/cars/${fipeCode}/years/${year}-5/history`;
    
    // Obter o token da variável de configuração global
    const fipeToken = window.config ? window.config["fipe-token"] : null;
    const headers = {};
    if (fipeToken) {
        headers['X-Subscription-Token'] = fipeToken;
    }

    try {
        const response = await fetch(fipeApiUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Dados da FIPE carregados:', data);
        return data.priceHistory;
    } catch (error) {
        console.error('Erro ao buscar dados da FIPE:', error);
        return [];
    }
}

function populateModelSelectFromLocalData() {
    if (modeloElement && window.carros && window.carros.length > 0) {
        $(modeloElement).empty();
        $(modeloElement).append('<option value="" disabled selected>Selecione um modelo</option>');
        window.carros.forEach(car => {
            const option = document.createElement('option');
            option.value = car.slug;
            option.textContent = car.modelo;
            // Adicionar os atributos fipe e ano para a nova função
            if(car.fipe){
                 option.setAttribute('data-fipe-code', car.fipe);
                 option.setAttribute('data-year', car.ano);
            }
            modeloElement.appendChild(option);
        });
        console.log('Select de modelos populado a partir de dados locais.');
    } else {
        console.warn('Elemento modelo ou dados de carros locais não disponíveis para popular o select.');
    }
}

async function updateCarPrice() {
    const selectedOption = modeloElement.options[modeloElement.selectedIndex];
    const selectedSlug = selectedOption.value;
    const selectedCar = window.carros.find(car => car.slug === selectedSlug);

    if (selectedCar && selectedCar.fipe) {
        const fipeCode = selectedOption.getAttribute('data-fipe-code');
        const year = selectedOption.getAttribute('data-year');
        const priceHistory = await fetchFipePrice(fipeCode, year);
        
        if (priceHistory && priceHistory.length >= 3) {
            const currentPrice = parseCurrencyToFloat(priceHistory[0].price);
            const threeMonthsAgoPrice = parseCurrencyToFloat(priceHistory[2].price);
            
            // Calcular depreciação do primeiro ano com base na variação dos 3 meses
            const priceChange = threeMonthsAgoPrice - currentPrice;
            DEPRECIACAO_ANUAL_RATE_DEFAULT = (priceChange / threeMonthsAgoPrice) * (12/3); // Projeta para um ano
            
            if (selectedCar) {
                selectedCar.fipePrice = currentPrice;
            }
            precoElement.value = formatCurrency(currentPrice);
            console.log(`Nova taxa de depreciação do primeiro ano calculada: ${(DEPRECIACAO_ANUAL_RATE_DEFAULT * 100).toFixed(2)}%`);
        } else {
            // Se não houver dados suficientes, usa o valor padrão de 15%
            DEPRECIACAO_ANUAL_RATE_DEFAULT = 0.15;
            if (selectedCar) {
                selectedCar.fipePrice = 0;
            }
            precoElement.value = formatCurrency(0);
            console.warn('Não há dados suficientes da FIPE para calcular a depreciação dinâmica. Usando a taxa padrão de 15%.');
        }
    } else {
        DEPRECIACAO_ANUAL_RATE_DEFAULT = 0.15;
        precoElement.value = formatCurrency(0);
    }
    
    // Chamar onFormChange para recalcular tudo após o preço ser atualizado
    onFormChange();
    console.log(`Preço do carro "${selectedCar?.modelo || 'Nenhum'}" e taxa de depreciação atualizados.`);
}

function updateCarData() {
    const selectedOption = modeloElement.options[modeloElement.selectedIndex];
    const selectedSlug = selectedOption.value;
    const selectedCar = window.carros.find(car => car.slug === selectedSlug);

    const period = periodoElement.value;
    const usoMensal = usoMensalElement.value;
    
    const key = `${period}x${usoMensal}`;
    const keyManutencao = `manutencao-${period}`;
    
    // Usar o preço FIPE já armazenado
    if (selectedCar && selectedCar.fipePrice) {
        precoElement.value = formatCurrency(selectedCar.fipePrice);
    } else {
        precoElement.value = formatCurrency(0);
    }

    if (selectedCar && selectedCar[key]) {
        parcelasElement.value = formatCurrency(selectedCar[key]);
    } else {
        parcelasElement.value = formatCurrency(0);
    }

    if (selectedCar && selectedCar[keyManutencao]) {
        manutencaoElement.value = formatCurrency(selectedCar[keyManutencao]/12);
    } else {
        manutencaoElement.value = formatCurrency(0);
    }
    
    // Chamar onFormChange para recalcular tudo sem chamar a API
    onFormChange();
    console.log(`Dados do carro "${selectedCar?.modelo || 'Nenhum'}" atualizados sem nova requisição FIPE.`);
}

const irAliquots = [
    { months: 6, aliquot: 0.2250 },
    { months: 12, aliquot: 0.20 },
    { months: 24, aliquot: 0.1750 },
    { months: Infinity, aliquot: 0.15 }
];

function getIRAliquot(months) {
    for (const rule of irAliquots) {
        if (months <= rule.months) {
            return rule.aliquot;
        }
    }
    return 0;
}

function createJurosCurveTable() {
    const jurosCurve = [];
    if (!anbimaData || Object.keys(anbimaData).length === 0) {
        console.warn('Dados da ANBIMA não carregados para criar a curva de juros.');
        return [];
    }
    const beta1 = anbimaData.beta1;
    const beta2 = anbimaData.beta2;
    const beta3 = anbimaData.beta3;
    const beta4 = anbimaData.beta4;
    const lambda1 = anbimaData.lambda1;
    const lambda2 = anbimaData.lambda2;
    const custoCorretagemMensal = 0.000416;

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
        const taxaLiquidaAoPeriodo = (1 - irAliquot) * (taxaBrutaAoPeriodo - custoCorretagemMensal);
        jurosCurve.push({
            "Mês": month,
            "Taxa Bruta ao ano": `${(yieldAnnual * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
            "Taxa Bruta ao período": `${(taxaBrutaAoPeriodo * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
            "Taxa Líquida ao período": `${(taxaLiquidaAoPeriodo * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`
        });
    }
    return jurosCurve;
}

$(document).ready(function() {
    console.log('Script carregado com sucesso!');
    fetchApiData().then(() => {
        populateModelSelectFromLocalData();
        createJurosCurveTable();
        applyDefaultConfig();
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
    depreciacaoTotalElement = $('[data-total="depreciacao"]');
    depreciacaoPrecoElement = $('[data-total="depreciacao_preco"]');
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

function applyDefaultConfig() {
    if (window.config) {
        const config = window.config;
        if (config["taxa-a-m"]) {
            taxaAMElement.value = config["taxa-a-m"];
        }
        if (config.entrada) {
            entradaElement.value = config.entrada;
        }
        if (config.emplacamento) {
            emplacamentoElement.value = config.emplacamento;
        }
        if (config["licenciamento-pg90r"]) {
            licenciamentoElement.value = config["licenciamento-pg90r"];
        }
        if (config.ipva) {
            ipvaElement.value = config.ipva;
        }
        if (config.seguro) {
            seguroElement.value = config.seguro;
        }
        setupInputFormatting();
        onFormChange();
    }
}

function formatCurrency(value) {
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercentage(value) {
    return `${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function parseCurrencyToFloat(currencyString) {
    if (!currencyString) return 0;
    return parseFloat(currencyString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

function parsePercentageToFloat(percentageString) {
    if (!percentageString) return 0;
    return parseFloat(percentageString.replace('%', '').replace(',', '.').trim());
}

function calculateOpportunityCost(scenarioType, principalValue, period, anbimaData, allCalculatedValues, annualFinancialDetails) {
    let totalOpportunityCost = 0;
    const jurosCurve = createJurosCurveTable();
    if (!anbimaData || Object.keys(anbimaData).length === 0 || period <= 0 || !jurosCurve || jurosCurve.length === 0) {
        console.warn('Dados insuficientes para calcular Custo de Oportunidade.');
        return 0;
    }
    const { manutencao, emplacamentoValue, parcelaMensal, parcelas, usoMensal } = allCalculatedValues;
    // console.group(`Custo de Oportunidade - Cenário: ${scenarioType.toUpperCase()}`);
    for (let month = 1; month <= period; month++) {
        let cashOutflowThisMonth = 0;
        const remainingPeriod = period - (month - 1);
        const remainingPeriodLiquidRateData = jurosCurve.find(item => item["Mês"] === remainingPeriod);
        if (!remainingPeriodLiquidRateData) {
            console.warn(`Taxa Líquida ao período não encontrada para o período restante (${remainingPeriod} meses) no mês ${month}.`);
            continue;
        }
        const remainingPeriodLiquidRate = parsePercentageToFloat(remainingPeriodLiquidRateData["Taxa Líquida ao período"]) / 100;
        const currentYearIndex = Math.floor((month - 1) / 12);
        const firstMonthOfYear = (month - 1) % 12 === 0;

        if (scenarioType === 'vista') {
            if (month === 1) {
                cashOutflowThisMonth += principalValue;
                cashOutflowThisMonth += emplacamentoValue;
            }
            cashOutflowThisMonth += manutencao;
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
        } else if (scenarioType === 'financiada') {
            if (month === 1) {
                cashOutflowThisMonth += principalValue;
                cashOutflowThisMonth += emplacamentoValue;
            }
            cashOutflowThisMonth += parcelaMensal;
            cashOutflowThisMonth += manutencao;
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
        } else if (scenarioType === 'assinatura') {
            cashOutflowThisMonth += parcelas;
            cashOutflowThisMonth += usoMensal;
        }
        const monthlyOpportunityCost = cashOutflowThisMonth * remainingPeriodLiquidRate;
        totalOpportunityCost += monthlyOpportunityCost;
        // console.log(`Mês ${month}:`);
        // console.log(`  Saída de Caixa (Fluxo): ${formatCurrency(cashOutflowThisMonth)}`);
        // console.log(`  Taxa Líquida ao Período Restante (${remainingPeriod} meses): ${(remainingPeriodLiquidRate * 100).toFixed(4).replace('.', ',')}%`);
        // console.log(`  Custo de Oportunidade Mensal: ${formatCurrency(monthlyOpportunityCost)}`);
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
    $('[data-type="currency"]').each(function() {
        const $input = $(this);
        if ($input.val()) {
            $input.val(formatCurrency(parseCurrencyToFloat($input.val())));
        }
        $input.on('input', function() {
            let value = $input.val();
            value = value.replace(/\D/g, '');
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
    $('[data-type="percentage"]').each(function() {
        const $input = $(this);
        if ($input.val()) {
            $input.val(formatPercentage(parsePercentageToFloat($input.val())));
        }
        $input.on('input', function() {
            let value = $input.val();
            value = value.replace(/\D/g, '');
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
    const usoMensal = parseCurrencyToFloat(usoMensalElement.value);

    let currentCarValueForDepreciation = preco;
    let totalDepreciacaoCalculated = 0;
    let totalSeguroPeriodo = 0;
    let totalIpvaPeriodo = 0;
    let totalLicenciamentoPeriodo = 0;
    let annualFinancialDetails = [];

    const fullYearsInPeriod = Math.floor(periodo / 12);
    const remainingMonthsInPartialYear = periodo % 12;

    console.group('Depreciação Anual e Valor do Carro');
    console.log(`Valor inicial do carro: ${formatCurrency(preco)}`);

    for (let year = 0; year < fullYearsInPeriod; year++) {
        const annualSeguroThisYear = seguroPercentage * currentCarValueForDepreciation / 100;
        const annualIpvaThisYear = ipvaPercentage * currentCarValueForDepreciation / 100;
        const annualLicenciamentoThisYear = licenciamentoValue;

        totalSeguroPeriodo += annualSeguroThisYear;
        totalIpvaPeriodo += annualIpvaThisYear;
        totalLicenciamentoPeriodo += annualLicenciamentoThisYear;

        const depreciationRateForThisYear = (year === 0) ? DEPRECIACAO_ANUAL_RATE_DEFAULT : DEPRECIACAO_ANUAL_RATE_LONGER_PERIOD;
        const depreciationAmountThisYear = currentCarValueForDepreciation * depreciationRateForThisYear;
        
        totalDepreciacaoCalculated += depreciationAmountThisYear;
        currentCarValueForDepreciation -= depreciationAmountThisYear;

        annualFinancialDetails.push({
            year: year + 1,
            startOfYearCarValue: preco - totalDepreciacaoCalculated,
            annualSeguro: annualSeguroThisYear,
            annualIpva: annualIpvaThisYear,
            annualLicenciamento: annualLicenciamentoThisYear,
            depreciationAmount: depreciationAmountThisYear
        });
        console.log(`Fim do Ano ${year + 1}: Valor do carro = ${formatCurrency(currentCarValueForDepreciation)}`);
    }

    if (remainingMonthsInPartialYear > 0) {
        const monthsFraction = remainingMonthsInPartialYear / 12;
        const annualSeguroThisPartialYear = seguroPercentage * currentCarValueForDepreciation / 100;
        const annualIpvaThisPartialYear = ipvaPercentage * currentCarValueForDepreciation / 100;
        const annualLicenciamentoThisPartialYear = licenciamentoValue;

        totalSeguroPeriodo += annualSeguroThisPartialYear * monthsFraction;
        totalIpvaPeriodo += annualIpvaThisPartialYear * monthsFraction;
        totalLicenciamentoPeriodo += annualLicenciamentoThisPartialYear * monthsFraction;

        const depreciationRateForPartialYear = (fullYearsInPeriod === 0) ? DEPRECIACAO_ANUAL_RATE_DEFAULT : DEPRECIACAO_ANUAL_RATE_LONGER_PERIOD;
        const depreciationAmountThisPartialYear = currentCarValueForDepreciation * depreciationRateForPartialYear * monthsFraction;
        
        totalDepreciacaoCalculated += depreciationAmountThisPartialYear;
        currentCarValueForDepreciation -= depreciationAmountThisPartialYear;
        annualFinancialDetails.push({
            year: fullYearsInPeriod + 1,
            startOfYearCarValue: preco - totalDepreciacaoCalculated,
            annualSeguro: annualSeguroThisPartialYear,
            annualIpva: annualIpvaThisPartialYear,
            annualLicenciamento: annualLicenciamentoThisPartialYear,
            depreciationAmount: depreciationAmountThisPartialYear
        });
        console.log(`Fim do Período (após ${periodo} meses): Valor do carro = ${formatCurrency(currentCarValueForDepreciation)}`);
    } else if (fullYearsInPeriod === 0 && periodo === 0) {
        console.log(`Fim do Período (após ${periodo} meses): Valor do carro = ${formatCurrency(currentCarValueForDepreciation)}`);
    }
    console.groupEnd();

    const depreciacaoPrecoFinal = preco - totalDepreciacaoCalculated;
    seguroTotal = totalSeguroPeriodo;
    ipvaTotal = totalIpvaPeriodo;
    manutencaoTotal = manutencao * periodo;
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
    const allCalculatedValuesForOpportunityCost = {
        seguroTotal: seguroTotal,
        ipvaTotal: ipvaTotal,
        manutencao: manutencao,
        licenciamentoValue: licenciamentoValue,
        emplacamentoValue: emplacamentoValue,
        parcelaMensal: parcelaMensal,
        parcelas: parcelas,
        usoMensal: usoMensal
    };

    const custoOportunidadeFinanciada = calculateOpportunityCost('financiada', entradaTotal, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeVista = calculateOpportunityCost('vista', preco, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeAssinatura = calculateOpportunityCost('assinatura', null, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);

    periodoTotalElement.text(`${periodo}`);
    seguroTotalElement.text(formatCurrency(seguroTotal));
    ipvaTotalElement.text(formatCurrency(ipvaTotal));
    licenciamentoTotalElement.text(formatCurrency(totalLicenciamentoPeriodo));
    emplacamentoTotalElement.text(formatCurrency(emplacamentoValue));
    manutencaoAnoTotalElement.text(formatCurrency(manutencao));
    manutencaoTotalElement.text(formatCurrency(manutencaoTotal));
    depreciacaoTotalElement.text(formatCurrency(totalDepreciacaoCalculated));
    depreciacaoPrecoElement.text(formatCurrency(depreciacaoPrecoFinal));
    entradaTotalElement.text(formatCurrency(entradaTotal));
    jurosTotalElement.text(formatCurrency(jurosTotal));
    jurosTaxaElement.text(`${taxaAM.toFixed(2).replace('.', ',')}%`);
    custoAssinaturaTotalElement.text(formatCurrency(assinaturaTotal));
    assinatura1_12TotalElement.text(formatCurrency(parcelas));
    precoTotalElement.text(formatCurrency(preco));
    custoOportunidadeFinanciadaTotalElement.text(formatCurrency(custoOportunidadeFinanciada));
    custoOportunidadeVistaTotalElement.text(formatCurrency(custoOportunidadeVista));
    custoOportunidadeAssinaturaTotalElement.text(formatCurrency(custoOportunidadeAssinatura));

    const financiadaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue + jurosTotal + custoOportunidadeFinanciada + totalDepreciacaoCalculated;
    financiadaTotalElement.text(formatCurrency(financiadaCalcTotal));
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
