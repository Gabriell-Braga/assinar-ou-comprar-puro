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
let usoMensalTotalElement;
let imagemTotalElement;
let modeloTotalElement;
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

let licenciamentoAnualElement;
let ipvaAnualElement;
let seguroAnualElement;
let manutencaoAnualElement;

let financiadaDiferencaElement;
let vistaDiferencaElement;

let financiadaTotalElement;
let vistaTotalElement;
let assinaturaTotalElement;

let anbimaData = {};
let catalogData = {};

function populateModelSelectFromLocalData() {
    if (modeloElement && window.carros && window.carros.length > 0) {
        $(modeloElement).empty();
        $(modeloElement).append('<option value="" disabled selected>Selecione um modelo</option>');
        window.carros.forEach(car => {
            const option = document.createElement('option');
            option.value = car.slug;
            option.textContent = car.modelo;
            modeloElement.appendChild(option);
        });

        const allSelects = document.querySelectorAll('select');
        allSelects.forEach(select => {
            createCustomSelect(select);
        });
        console.log('Select de modelos populado a partir de dados locais.');
    } else {
        console.warn('Elemento modelo ou dados de carros locais não disponíveis para popular o select.');
    }
}

const irAliquots = [
    { months: 6, aliquot: 0.2250 },
    { months: 12, aliquot: 0.20 },
    { months: 24, aliquot: 0.1750 },
    { months: Infinity, aliquot: 0.15 }
];

/**
 * Gets the IR aliquot based on the number of months.
 * @param {number} months - The number of months.
 * @returns {number} The IR aliquot.
 */
function getIRAliquot(months) {
    for (const rule of irAliquots) {
        if (months <= rule.months) {
            return rule.aliquot;
        }
    }
    return 0;
}

/**
 * Creates the interest rate curve table based on ANBIMA data.
 * @returns {Array<Object>} An array representing the interest curve.
 */
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

function convertToBrazilianDecimal(value) {
    if (typeof value === 'string' || typeof value === 'number') {
        const stringValue = String(value);
        return stringValue.replace('.', ',');
    }
    return value;
}

/**
 * Reads URL parameters and fills form fields and triggers a calculation.
 */
function readUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    const modeloSlug = urlParams.get('modelo');
    const periodo = urlParams.get('periodo');
    const usoMensal = urlParams.get('uso_mensal');
    const seguro = urlParams.get('seguro');
    const ipva = urlParams.get('ipva');
    const licenciamento = urlParams.get('licenciamento');
    const emplacamento = urlParams.get('emplacamento');
    const manutencao = urlParams.get('manutencao');
    const entrada = urlParams.get('entrada');
    const taxaAM = urlParams.get('taxa_am');
    const pular = urlParams.get('pular'); // Novo parâmetro para pular para o resultado

    let hasParams = false;

    if (modeloSlug && modeloElement) {
        $(modeloElement).val(modeloSlug).trigger('change');
        hasParams = true;
    }
    if (periodo && periodoElement) {
        $(periodoElement).val(periodo).trigger('change');
        hasParams = true;
    }
    if (usoMensal && usoMensalElement) {
        $(usoMensalElement).val(usoMensal).trigger('change');
        hasParams = true;
    }
    
    if (seguro && seguroElement) {
        seguroElement.value = convertToBrazilianDecimal(seguro);
        hasParams = true;
    }

    if (ipva && ipvaElement) {
        ipvaElement.value = convertToBrazilianDecimal(ipva);
        hasParams = true;
    }

    if (licenciamento && licenciamentoElement) {
        licenciamentoElement.value = convertToBrazilianDecimal(licenciamento);
        hasParams = true;
    }

    if (emplacamento && emplacamentoElement) {
        emplacamentoElement.value = convertToBrazilianDecimal(emplacamento);
        hasParams = true;
    }

    if (manutencao && manutencaoElement) {
        manutencaoElement.value = convertToBrazilianDecimal(manutencao);
        hasParams = true;
    }

    if (entrada && entradaElement) {
        entradaElement.value = convertToBrazilianDecimal(entrada);
        hasParams = true;
    }

    if (taxaAM && taxaAMElement) {
        taxaAMElement.value = convertToBrazilianDecimal(taxaAM);
        hasParams = true;
    }

    if (hasParams) {
        // Se houver parâmetros, acione a atualização do formulário.
        onFormChange();
        const allSelects = document.querySelectorAll('select');
        allSelects.forEach(select => {
            createCustomSelect(select);
        });
    }

    setupInputFormatting();
    
    // Retorna se o parâmetro "pular" está presente e se os parâmetros essenciais estão preenchidos
    return hasParams && pular === 'true';
}

$(document).ready(function() {
    console.log('Script carregado com sucesso!');

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
    usoMensalTotalElement = $('[data-total="uso_mensal"]');
    modeloTotalElement = $('[data-total="modelo_carro"]');
    imagemTotalElement = $('[data-total="imagem_carro"]');
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

    licenciamentoAnualElement = $('[data-total="licenciamento_anual"]');
    ipvaAnualElement = $('[data-total="ipva_anual"]');
    seguroAnualElement = $('[data-total="seguro_anual"]');
    manutencaoAnualElement = $('[data-total="manutencao_anual"]');

    financiadaDiferencaElement = $('[data-total="diferenca_financiada"]');
    vistaDiferencaElement = $('[data-total="diferenca_vista"]');
    assinaturaDiferencaElement = $('[data-total="diferenca_assinatura"]');

    financiadaTotalElement = $('[data-total="financiada"]');
    vistaTotalElement = $('[data-total="vista"]');
    assinaturaTotalElement = $('[data-total="assinatura"]');
    
    $(modeloElement).on('change', onFormChange);
    $(periodoElement).on('change', onFormChange);
    $(usoMensalElement).on('change', onFormChange);
    $(seguroElement).on('input', onFormChange);
    $(ipvaElement).on('input', onFormChange);
    $(licenciamentoElement).on('input', onFormChange);
    $(emplacamentoElement).on('input', onFormChange);
    $(manutencaoElement).on('input', onFormChange);
    $(entradaElement).on('input', onFormChange);
    $(taxaAMElement).on('input', onFormChange);

    anbimaData = window.anbima || {};
    populateModelSelectFromLocalData();
    createJurosCurveTable();
    applyDefaultConfig();
    setupInputFormatting();

    // Lê os parâmetros da URL no carregamento
    const shouldGoToResult = readUrlParameters();
    
    // Se o parâmetro 'pular' estiver presente, avança para a tela de resultado
    if (shouldGoToResult) {
        // Encontra o clique do botão 'next' para avançar
        // Isso simula o clique do usuário para manter o fluxo do design-control.js
        $('#next-button-1').trigger('click');
        $('#compare-button').trigger('click');

        setTimeout(() => {
            $('#next-button-2').trigger('click');
        }, 10);
    }
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

/**
 * Formats a number as a currency string (R$ X.XXX,XX).
 * @param {number} value - The number to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(value) {
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a number as a percentage string (X,XX%).
 * @param {number} value - The number to format.
 * @returns {string} The formatted percentage string.
 */
function formatPercentage(value) {
    return `${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * Parses a currency string (R$ X.XXX,XX) into a float.
 * @param {string} currencyString - The currency string to parse.
 * @returns {number} The parsed float value.
*/
function parseCurrencyToFloat(currencyString) {
    if (!currencyString) return 0;
    const cleanedString = currencyString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    if (cleanedString === '') return 0;
    return parseFloat(cleanedString);
}

/**
 * Parses a percentage string (X,XX%) into a float.
 * @param {string} percentageString - The percentage string to parse.
 * @returns {number} The parsed float value.
 */
function parsePercentageToFloat(percentageString) {
    if (!percentageString) return 0;
    const cleanedString = percentageString.replace('%', '').replace(',', '.').trim();
    if (cleanedString === '') return 0;
    return parseFloat(cleanedString);
}

/**
 * Calculates the opportunity cost for a given scenario (vista, financiada, assinatura).
 * @param {string} scenarioType - The type of scenario ('vista', 'financiada', 'assinatura').
 * @param {number} principalValue - The initial principal value for 'vista' or 'entrada' for 'financiada'.
 * @param {number} period - The total period in months.
 * @param {object} anbimaData - ANBIMA data for interest curve calculation.
 * @param {object} allCalculatedValues - Object containing various calculated values like maintenance, installment, etc.
 * @param {Array<object>} annualFinancialDetails - Details of annual financial outflows.
 * @returns {number} The total opportunity cost.
 */
function calculateOpportunityCost(scenarioType, principalValue, period, anbimaData, allCalculatedValues, annualFinancialDetails) {
    let totalOpportunityCost = 0;
    const jurosCurve = createJurosCurveTable();
    if (!anbimaData || Object.keys(anbimaData).length === 0 || period <= 0 || !jurosCurve || jurosCurve.length === 0) {
        console.warn('Dados insuficientes para calcular Custo de Oportunidade.');
        return 0;
    }
    const { manutencao, emplacamentoValue, parcelaMensal, parcelas, usoMensal } = allCalculatedValues;
    console.group(`Custo de Oportunidade - Cenário: ${scenarioType.toUpperCase()}`);
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
            cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro/12;
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
        } else if (scenarioType === 'financiada') {
            if (month === 1) {
                cashOutflowThisMonth += principalValue;
                cashOutflowThisMonth += emplacamentoValue;
            }
            cashOutflowThisMonth += manutencao; 
            cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro/12;
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
            if (month <= parcelasElement.value) {
                cashOutflowThisMonth += parcelaMensal;
            }
        } else if (scenarioType === 'assinatura') {
            cashOutflowThisMonth += parcelas;
        }
        const monthlyOpportunityCost = cashOutflowThisMonth * remainingPeriodLiquidRate;
        totalOpportunityCost += monthlyOpportunityCost;
        console.log(`Mês ${month}:`);
        console.log(`  Saída de Caixa (Fluxo): ${formatCurrency(cashOutflowThisMonth)}`);
        console.log(`  Taxa Líquida ao Período Restante (${remainingPeriod} meses): ${(remainingPeriodLiquidRate * 100).toFixed(4).replace('.', ',')}%`);
        console.log(`  Custo de Oportunidade Mensal: ${formatCurrency(monthlyOpportunityCost)}`);
    }
    console.groupEnd();
    return totalOpportunityCost;
}

function setupInputFormatting() {
    $('[data-type="currency"]').each(function() {
        const $input = $(this);
        if ($input.val()) {
            $input.val(formatCurrency(parseCurrencyToFloat($input.val())));
        }
        $input.off('input.currency').on('input.currency', function() {
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
        $input.off('blur.currency').on('blur.currency', function() {
            const rawValue = $input.val();
            if (!rawValue || parseCurrencyToFloat(rawValue) === 0) {
                $input.val(formatCurrency(0));
            } else {
                $input.val(formatCurrency(parseCurrencyToFloat(rawValue)));
            }
            onFormChange();
        });
    });

    // Percentage formatting
    $('[data-type="percentage"]').each(function() {
        const $input = $(this);
        if ($input.val()) {
            $input.val(formatPercentage(parsePercentageToFloat($input.val())));
        }
        $input.off('input.percentage').on('input.percentage', function() {
            let value = $input.val();
            value = value.replace(/[^\d,]/g, '');
            value = value.replace(',', '.');

            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }

            let floatValue = parseFloat(value);
            if (isNaN(floatValue)) {
                $input.val('');
                return;
            }
            $input.val(formatPercentage(floatValue));
        });
        $input.off('blur.percentage').on('blur.percentage', function() {
            const rawValue = $input.val();
            if (!rawValue || parsePercentageToFloat(rawValue) === 0) {
                $input.val(formatPercentage(0));
            } else {
                $input.val(formatPercentage(parsePercentageToFloat(rawValue)));
            }
            onFormChange();
        });
    });
}

function onFormChange(itsModeloChange = null){
    const selectedOption = modeloElement.options[modeloElement.selectedIndex];
    const selectedSlug = selectedOption ? selectedOption.value : null;
    const selectedCar = selectedSlug ? window.carros.find(car => car.slug === selectedSlug) : null;

    let preco0km = selectedCar ? selectedCar['preco-0km'] : 0;
    const precoUsuario = parseCurrencyToFloat(precoElement.value);
    const periodo = parseFloat(periodoElement.value);
    const seguroPercentage = parsePercentageToFloat(seguroElement.value);
    const ipvaPercentage = parsePercentageToFloat(ipvaElement.value);
    const entradaPercentage = parsePercentageToFloat(entradaElement.value);
    const taxaAM = parsePercentageToFloat(taxaAMElement.value);
    const licenciamentoValue = parseCurrencyToFloat(licenciamentoElement.value);
    const emplacamentoValue = parseCurrencyToFloat(emplacamentoElement.value);
    
    let parcelas = 0;
    let usoMensal = 0;
    if (selectedCar) {
        const subscriptionKey = `${periodo}x${usoMensalElement.value}`;
        parcelas = selectedCar[subscriptionKey] || 0;
        usoMensal = parseCurrencyToFloat(usoMensalElement.value);
    }

    if (selectedCar) {
        if (precoElement.value === "" || precoUsuario === preco0km || precoUsuario === 0 || itsModeloChange) {
            precoElement.value = formatCurrency(preco0km);
        }else{
            preco0km = parseCurrencyToFloat(precoElement.value);
        }

        parcelasElement.value = formatCurrency(parcelas);

        let manutencao12_car = selectedCar?.['manutencao-12']*1 || 0;
        let manutencao24_car_incremental = selectedCar?.['manutencao-24']*1 || 0;
        let manutencao36_car_incremental = selectedCar?.['manutencao-36']*1 || 0;

        let totalManutencaoCumulative = 0;
        if (periodo <= 12) {
            totalManutencaoCumulative = manutencao12_car;
        } else if (periodo <= 24) {
            totalManutencaoCumulative = manutencao12_car + manutencao24_car_incremental;
        } else if (periodo <= 36) {
            totalManutencaoCumulative = manutencao12_car + manutencao24_car_incremental + manutencao36_car_incremental;
        } else {
            totalManutencaoCumulative = manutencao12_car + manutencao24_car_incremental + manutencao36_car_incremental;
        }

        const manutencaoMonthlyAverage = (periodo > 0) ? totalManutencaoCumulative / periodo : 0;

        manutencaoElement.value = formatCurrency(manutencaoMonthlyAverage);

        manutencaoTotal = totalManutencaoCumulative;

    } else {
        precoElement.value = formatCurrency(0);
        parcelasElement.value = formatCurrency(0);
        manutencaoElement.value = formatCurrency(0);
        manutencaoTotal = 0;
    }

    const manutencao = parseCurrencyToFloat(manutencaoElement.value);

    let totalDepreciacaoCalculated = 0; 
    let depreciacaoPrecoFinal = preco0km;

    if (selectedCar && preco0km > 0) {
        const numFullYearsInPeriod = periodo / 12;
        const remainingMonths = periodo % 12;

        console.group('Depreciação Ano a Ano');

        let currentCarValueAfterDepreciation = preco0km; 

        for (let year = 1; year <= numFullYearsInPeriod; year++) {
            console.log(`Ano ${year} (início): Valor do carro para depreciação = ${formatCurrency(currentCarValueAfterDepreciation)}`);

            const depreciationAmountThisYear = currentCarValueAfterDepreciation * (selectedCar['depreciacao-'+(year*12)] / 100);
            currentCarValueAfterDepreciation -= depreciationAmountThisYear; // Atualiza o valor do carro para o próximo cálculo

            console.log(`Ano ${year} (12 meses): Taxa de depreciação anual = ${formatPercentage(selectedCar['depreciacao-'+(year*12)])}, Valor depreciado neste ano = ${formatCurrency(depreciationAmountThisYear)}`);
        }

        if (remainingMonths > 0) {
            let annualDepreciationRateForPartialYear = 0;
            const currentYearNum = numFullYearsInPeriod + 1;

            console.log(`Ano ${currentYearNum} (início - parcial): Valor do carro para depreciação = ${formatCurrency(currentCarValueAfterDepreciation)}`);

            if (currentYearNum === 1) {
                annualDepreciationRateForPartialYear = (selectedCar['depreciacao-12'] || 0);
            } else if (currentYearNum === 2) {
                const d12_cum = (selectedCar['depreciacao-12'] || 0) / 100;
                const d24_cum = (selectedCar['depreciacao-24'] || 0) / 100;
                if ((1 - d12_cum) > 0) {
                    annualDepreciationRateForPartialYear = (1 - ( (1 - d24_cum) / (1 - d12_cum) )) * 100;
                } else {
                    annualDepreciationRateForPartialYear = 0;
                }
            } else if (currentYearNum === 3) {
                const d24_cum = (selectedCar['depreciacao-24'] || 0) / 100;
                const d36_cum = (selectedCar['depreciacao-36'] || 0) / 100;
                if ((1 - d24_cum) > 0) {
                    annualDepreciationRateForPartialYear = (1 - ( (1 - d36_cum) / (1 - d24_cum) )) * 100;
                } else {
                    annualDepreciationRateForPartialYear = 0;
                }
            } else {
                annualDepreciationRateForPartialYear = 5; // Padrão para anos > 3
            }

            const depreciationAmountPartialYear = currentCarValueAfterDepreciation * (annualDepreciationRateForPartialYear / 100) * (remainingMonths / 12);
            currentCarValueAfterDepreciation -= depreciationAmountPartialYear; // Atualiza para o valor final
            console.log(`Ano ${currentYearNum} (${remainingMonths} meses): Taxa de depreciação anual = ${formatPercentage(annualDepreciationRateForPartialYear)}, Valor depreciado neste período = ${formatCurrency(depreciationAmountPartialYear)}`);
        }
        console.groupEnd();

        depreciacaoPrecoFinal = parseFloat(currentCarValueAfterDepreciation.toFixed(2));
        totalDepreciacaoCalculated = preco0km - depreciacaoPrecoFinal;
    } else {
        totalDepreciacaoCalculated = 0;
        depreciacaoPrecoFinal = preco0km; 
    }
    let currentCarValueForAnnualCalc = preco0km;
    let totalSeguroPeriodo = 0;
    let totalIpvaPeriodo = 0;
    let totalLicenciamentoPeriodo = 0;
    let annualFinancialDetails = [];

    const fullYearsInPeriod = Math.floor(periodo / 12);
    const remainingMonthsInPartialYear = periodo % 12;

    console.group('Cálculo de Seguro, IPVA e Licenciamento por Período');
    console.log(`Valor inicial do carro para cálculo de despesas anuais: ${formatCurrency(preco0km)}`);

    let valueForThisYear = preco0km;
    for (let year = 0; year < fullYearsInPeriod; year++) {
        
        if (year === 0) {
            valueForThisYear = preco0km;
        } else if (year === 1 && selectedCar?.['depreciacao-12']) {
            valueForThisYear = valueForThisYear * (1- (selectedCar['depreciacao-12'] / 100));
        } else if (year === 2 && selectedCar?.['depreciacao-24']) {
            valueForThisYear = valueForThisYear * (1- (selectedCar['depreciacao-24'] / 100));
        }
        
        currentCarValueForAnnualCalc = valueForThisYear;

        console.log("VALOR ANO "+ year+1 + " " + currentCarValueForAnnualCalc);

        const annualSeguroThisYear = seguroPercentage * currentCarValueForAnnualCalc / 100;
        const annualIpvaThisYear = ipvaPercentage * currentCarValueForAnnualCalc / 100;
        const annualLicenciamentoThisYear = licenciamentoValue;

        totalSeguroPeriodo += annualSeguroThisYear;
        totalIpvaPeriodo += annualIpvaThisYear;
        totalLicenciamentoPeriodo += annualLicenciamentoThisYear;

        annualFinancialDetails.push({
            year: year + 1,
            annualSeguro: annualSeguroThisYear,
            annualIpva: annualIpvaThisYear,
            annualLicenciamento: annualLicenciamentoThisYear,
        });
        console.log(`Ano ${year + 1}: Valor do carro para cálculo de despesas = ${formatCurrency(currentCarValueForAnnualCalc)}`);
    }

    if (remainingMonthsInPartialYear > 0) {
        const monthsFraction = remainingMonthsInPartialYear / 12;
        const annualSeguroThisPartialYear = seguroPercentage * currentCarValueForAnnualCalc / 100;
        const annualIpvaThisPartialYear = ipvaPercentage * currentCarValueForAnnualCalc / 100;
        const annualLicenciamentoThisPartialYear = licenciamentoValue;

        totalSeguroPeriodo += annualSeguroThisPartialYear * monthsFraction;
        totalIpvaPeriodo += annualIpvaThisPartialYear * monthsFraction;
        totalLicenciamentoPeriodo += annualLicenciamentoThisPartialYear * monthsFraction;

        annualFinancialDetails.push({
            year: fullYearsInPeriod + 1,
            annualSeguro: annualSeguroThisPartialYear,
            annualIpva: annualIpvaThisPartialYear,
            annualLicenciamento: annualLicenciamentoThisPartialYear,
        });
        console.log(`Fim do Período (após ${periodo} meses): Valor do carro para cálculo de despesas = ${formatCurrency(currentCarValueForAnnualCalc)}`);
    } else if (fullYearsInPeriod === 0 && periodo === 0) {
        console.log(`Fim do Período (após ${periodo} meses): Valor do carro para cálculo de despesas = ${formatCurrency(currentCarValueForAnnualCalc)}`);
    }
    console.groupEnd();

    seguroTotal = totalSeguroPeriodo;
    ipvaTotal = totalIpvaPeriodo;
    entradaTotal = entradaPercentage * preco0km / 100;
    const valorFinanciado = preco0km - entradaTotal;
    
    const taxaMensalDecimal = taxaAM / 100;
    let parcelaMensal = 0;

    if (taxaMensalDecimal > 0 && periodo > 0) {
        parcelaMensal = valorFinanciado * (taxaMensalDecimal * Math.pow((1 + taxaMensalDecimal), periodo)) / (Math.pow((1 + taxaMensalDecimal), periodo) - 1);
    } else if (periodo > 0) {
        parcelaMensal = valorFinanciado / periodo; 
    } else {
        parcelaMensal = 0;
    }

    const totalPagoComJuros = parcelaMensal * periodo;
    jurosTotal = totalPagoComJuros - valorFinanciado;
    if (valorFinanciado <= 0) {
        jurosTotal = 0;
    }
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
    const custoOportunidadeVista = calculateOpportunityCost('vista', preco0km*1, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeAssinatura = calculateOpportunityCost('assinatura', null, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);

    // Update display elements
    periodoTotalElement.text(`${periodo}`);
    usoMensalTotalElement.text(usoMensalElement.value ? `${parseCurrencyToFloat(usoMensalElement.value)} KM` : '0 KM');
    imagemTotalElement.attr("src", selectedCar?.imagem);
    modeloTotalElement.text(selectedCar?.modelo);
    seguroTotalElement.text(formatCurrency(seguroTotal));
    ipvaTotalElement.text(formatCurrency(ipvaTotal));
    licenciamentoTotalElement.text(formatCurrency(totalLicenciamentoPeriodo));
    emplacamentoTotalElement.text(formatCurrency(emplacamentoValue));
    manutencaoAnoTotalElement.text(formatCurrency(manutencao * 12));
    manutencaoTotalElement.text(formatCurrency(manutencaoTotal));
    depreciacaoTotalElement.text(formatCurrency(totalDepreciacaoCalculated));
    depreciacaoPrecoElement.text(formatCurrency(depreciacaoPrecoFinal));
    entradaTotalElement.text(formatCurrency(entradaTotal));
    jurosTotalElement.text(formatCurrency(jurosTotal));
    jurosTaxaElement.text(`${taxaAM.toFixed(2).replace('.', ',')}%`);
    custoAssinaturaTotalElement.text(formatCurrency(assinaturaTotal));
    assinatura1_12TotalElement.text(formatCurrency(parcelas));
    precoTotalElement.text(formatCurrency(preco0km));
    custoOportunidadeFinanciadaTotalElement.text(formatCurrency(custoOportunidadeFinanciada));
    custoOportunidadeVistaTotalElement.text(formatCurrency(custoOportunidadeVista));
    custoOportunidadeAssinaturaTotalElement.text(formatCurrency(custoOportunidadeAssinatura));

    licenciamentoAnualElement.text(formatCurrency(licenciamentoValue));
    ipvaAnualElement.html(`${formatCurrency(annualFinancialDetails[0]?.annualIpva)} no 1° ano <br>+ ${formatCurrency(annualFinancialDetails[1]?.annualIpva)} no 2° ano <br>+ ${formatCurrency(annualFinancialDetails[2]?.annualIpva)} no 3° ano`);
    seguroAnualElement.html(`${formatCurrency(annualFinancialDetails[0]?.annualSeguro)} no 1° ano <br>+ ${formatCurrency(annualFinancialDetails[1]?.annualSeguro)} no 2° ano <br>+ ${formatCurrency(annualFinancialDetails[2]?.annualSeguro)} no 3° ano`);
    manutencaoAnualElement.html(`${formatCurrency(selectedCar?.['manutencao-12'])} no 1° ano <br>+ ${formatCurrency(selectedCar?.['manutencao-24'])} no 2° ano <br>+ ${formatCurrency(selectedCar?.['manutencao-36'])} no 3° ano`);

    const financiadaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue + jurosTotal + custoOportunidadeFinanciada + totalDepreciacaoCalculated;
    financiadaTotalElement.text(formatCurrency(financiadaCalcTotal));

    console.log(seguroTotal, ipvaTotal, manutencaoTotal, totalLicenciamentoPeriodo, emplacamentoValue, jurosTotal, custoOportunidadeFinanciada, totalDepreciacaoCalculated);

    const vistaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue*1 + custoOportunidadeVista*1 + totalDepreciacaoCalculated;
    vistaTotalElement.text(formatCurrency(vistaCalcTotal));
    assinaturaTotalElement.text(formatCurrency(assinaturaTotal + custoOportunidadeAssinatura));

    let assinaturaDif = (assinaturaTotal + custoOportunidadeAssinatura);
    let financiadaDif = financiadaCalcTotal - assinaturaDif;
    let vistaDif = vistaCalcTotal - assinaturaDif;

    if(financiadaDif < 0 && financiadaDif < vistaDif){
        financiadaDiferencaElement.css('color', '#4DCB7B').css('background-color', '#EAF9EF');
        assinaturaDiferencaElement.css('color', '#FF5A60').css('background-color', '#FFF2F2');
        vistaDiferencaElement.css('color', '#FF5A60').css('background-color', '#FFF2F2');

        financiadaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px]"></i><span class="font-semibold">Melhor opção</span>`);
        vistaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px] rotate-180"></i>+${formatCurrency(vistaCalcTotal-financiadaCalcTotal)}`);
        assinaturaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px] rotate-180"></i>+${formatCurrency(assinaturaDif-financiadaCalcTotal)}`);
    }else if(vistaDif < 0 && vistaDif < financiadaDif){
        vistaDiferencaElement.css('color', '#4DCB7B').css('background-color', '#EAF9EF');
        assinaturaDiferencaElement.css('color', '#FF5A60').css('background-color', '#FFF2F2');
        financiadaDiferencaElement.css('color', '#FF5A60').css('background-color', '#FFF2F2');

        vistaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px]"></i><span class="font-semibold">Melhor opção</span>`);
        financiadaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px] rotate-180"></i>+${formatCurrency(financiadaCalcTotal-vistaCalcTotal)}`);
        assinaturaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px] rotate-180"></i>+${formatCurrency(assinaturaDif-vistaCalcTotal)}`);
    }else{
        assinaturaDiferencaElement.css('color', '#4DCB7B').css('background-color', '#EAF9EF');
        vistaDiferencaElement.css('color', '#FF5A60').css('background-color', '#FFF2F2');
        financiadaDiferencaElement.css('color', '#FF5A60').css('background-color', '#FFF2F2');

        assinaturaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px]"></i><span class="font-semibold">Melhor opção</span>`);
        financiadaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px] rotate-180"></i>+${formatCurrency(financiadaDif)}`);
        vistaDiferencaElement.html(`<i class="fal fa-thumbs-up text-[14px] rotate-180"></i>+${formatCurrency(vistaDif)}`);
    }

    if (anbimaData && Object.keys(anbimaData).length > 0) {
        const formattedAnbima = `beta1: ${anbimaData.beta1.toFixed(4).replace('.', ',')} | beta2: ${anbimaData.beta2.toFixed(4).replace('.', ',')} | beta3: ${anbimaData.beta3.toFixed(4).replace('.', ',')} | beta4: ${anbimaData.beta4.toFixed(4).replace('.', ',')} | lambda1: ${anbimaData.lambda1.toFixed(4).replace('.', ',')} | lambda2: ${anbimaData.lambda2.toFixed(4).replace('.', ',')}`;
        baseCalculoElement.text(formattedAnbima);
    }
    console.log('--- Totais Atuais (para depuração) ---');
    console.log(`Preço (0km): ${preco0km}`);
    console.log(`Período: ${periodo}`);
    console.log(`Seguro Total (Período): ${seguroTotal}`);
    console.log(`IPVA Total (Período): ${ipvaTotal}`);
    console.log(`Manutenção Total (Período - CUMULATIVA): ${manutencaoTotal}`);
    console.log(`Depreciação Total Calculada: ${totalDepreciacaoCalculated}`);
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
    console.log(`Vista Total (Calculado): ${vistaCalcTotal}`);
    console.log(`Assinatura Total (Calculado): ${assinaturaTotal + custoOportunidadeAssinatura}`);
    console.log('Dados ANBIMA carregados:', anbimaData);
    console.log('Dados do Catálogo carregados:', catalogData);
}
