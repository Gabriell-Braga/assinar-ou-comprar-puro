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

let financiadaTotalElement; // Added for chart update
let vistaTotalElement;     // Added for chart update
let assinaturaTotalElement; // Added for chart update

let anbimaData = {};
// catalogData is no longer used for fetching car details, keeping for potential future use or if it's populated elsewhere.
let catalogData = {}; 

/**
 * Fetches ANBIMA API data. This data is used for calculating opportunity cost.
 * Removed FIPE API call as per requirements.
 */
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
        console.error('Erro ao carregar dados da API ANBIMA:', error);
    }
}

/**
 * Populates the car model select dropdown using local data from window.carros.
 * Removed FIPE specific attributes as they are no longer needed.
 */
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

$(document).ready(function() {
    console.log('Script carregado com sucesso!');
    fetchApiData().then(() => {
        populateModelSelectFromLocalData();
        createJurosCurveTable();
        applyDefaultConfig();
    });

    // Get references to input elements
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

    // Get references to display elements (for totals)
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
    
    // Attach change listeners to relevant input fields to trigger recalculations
    $(modeloElement).on('change', onFormChange);
    $(periodoElement).on('change', onFormChange);
    $(usoMensalElement).on('change', onFormChange);
    $(seguroElement).on('input', onFormChange);
    $(ipvaElement).on('input', onFormChange);
    $(licenciamentoElement).on('input', onFormChange);
    $(emplacamentoElement).on('input', onFormChange);
    $(manutencaoElement).on('input', onFormChange); // This input will now be updated by the script, but user can still type
    $(entradaElement).on('input', onFormChange);
    $(taxaAMElement).on('input', onFormChange);


    // Form submission handlers
    $('#basic-form').on('submit', function(event) {
        event.preventDefault();
        if (this.checkValidity()) {
            // onFormChange is already called by individual input changes.
            // This just handles the UI transition for steps.
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
            // onFormChange is already called by individual input changes.
            // This just handles the UI transition for results.
            $('html, body').animate({
                scrollTop: $('#result').offset().top
            }, 1000);
        } else {
            console.log('Formulário complementar inválido!');
        }
    });

    setupInputFormatting();
});

/**
 * Applies default configuration values from window.config to the form fields.
 */
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
        // Do not set manutencaoElement here, it's dynamic based on car model
        setupInputFormatting(); // Reapply formatting after setting values
        onFormChange(); // Trigger recalculation after applying defaults
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
    // Handle cases where the string might be just "R$ " or empty
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
            // `manutencao` here is the monthly average of the cumulative total
            cashOutflowThisMonth += manutencao; 
            cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro/12;
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
        } else if (scenarioType === 'financiada') {
            if (month === 1) {
                cashOutflowThisMonth += principalValue; // This is the down payment (entrada)
                cashOutflowThisMonth += emplacamentoValue;
            }
            // `manutencao` here is the monthly average of the cumulative total
            cashOutflowThisMonth += manutencao; 
            cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualSeguro/12;
            if (firstMonthOfYear && annualFinancialDetails[currentYearIndex]) {
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualIpva;
                cashOutflowThisMonth += annualFinancialDetails[currentYearIndex].annualLicenciamento;
            }
            // Add monthly installment if within the financing period
            if (month <= parcelasElement.value) { // Assuming parcelasElement.value holds the number of installments
                cashOutflowThisMonth += parcelaMensal;
            }
        } else if (scenarioType === 'assinatura') {
            cashOutflowThisMonth += parcelas; // Monthly subscription cost
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

/**
 * Updates the heights of the comparison charts based on calculated total costs.
 */
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

/**
 * Sets up input formatting for currency and percentage fields.
 */
function setupInputFormatting() {
    // Currency formatting
    $('[data-type="currency"]').each(function() {
        const $input = $(this);
        // Set initial value to formatted currency if it exists
        if ($input.val()) {
            $input.val(formatCurrency(parseCurrencyToFloat($input.val())));
        }
        $input.off('input.currency').on('input.currency', function() { // Use namespace to prevent duplicate bindings
            let value = $input.val();
            value = value.replace(/\D/g, ''); // Remove all non-digits
            if (value.length === 0) {
                $input.val('');
                return;
            }
            let numericValue = parseInt(value, 10);
            let floatValue = numericValue / 100;
            $input.val(formatCurrency(floatValue));
        });
        $input.off('blur.currency').on('blur.currency', function() { // Use namespace
            const rawValue = $input.val();
            if (!rawValue || parseCurrencyToFloat(rawValue) === 0) {
                $input.val(formatCurrency(0));
            } else {
                $input.val(formatCurrency(parseCurrencyToFloat(rawValue)));
            }
            onFormChange(); // Trigger recalculation on blur to ensure final value is used
        });
    });

    // Percentage formatting
    $('[data-type="percentage"]').each(function() {
        const $input = $(this);
        // Set initial value to formatted percentage if it exists
        if ($input.val()) {
            $input.val(formatPercentage(parsePercentageToFloat($input.val())));
        }
        $input.off('input.percentage').on('input.percentage', function() { // Use namespace
            let value = $input.val();
            value = value.replace(/[^\d,]/g, ''); // Allow digits and comma
            value = value.replace(',', '.'); // Replace comma with dot for float parsing

            // Ensure only one dot for decimals
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }

            let floatValue = parseFloat(value);
            if (isNaN(floatValue)) {
                $input.val(''); // Clear if not a valid number
                return;
            }
            $input.val(formatPercentage(floatValue));
        });
        $input.off('blur.percentage').on('blur.percentage', function() { // Use namespace
            const rawValue = $input.val();
            if (!rawValue || parsePercentageToFloat(rawValue) === 0) {
                $input.val(formatPercentage(0));
            } else {
                $input.val(formatPercentage(parsePercentageToFloat(rawValue)));
            }
            onFormChange(); // Trigger recalculation on blur
        });
    });
}

/**
 * Main function to calculate and update all financial details based on form inputs.
 * This function is triggered whenever a relevant form input changes.
 */
function onFormChange(){
    const selectedOption = modeloElement.options[modeloElement.selectedIndex];
    const selectedSlug = selectedOption ? selectedOption.value : null;
    const selectedCar = selectedSlug ? window.carros.find(car => car.slug === selectedSlug) : null;

    // Retrieve values from form elements
    const preco0km = selectedCar ? selectedCar['preco-0km'] : 0; // Get 0km price from selected car
    const periodo = parseFloat(periodoElement.value);
    const seguroPercentage = parsePercentageToFloat(seguroElement.value);
    const ipvaPercentage = parsePercentageToFloat(ipvaElement.value);
    const entradaPercentage = parsePercentageToFloat(entradaElement.value);
    const taxaAM = parsePercentageToFloat(taxaAMElement.value);
    const licenciamentoValue = parseCurrencyToFloat(licenciamentoElement.value);
    const emplacamentoValue = parseCurrencyToFloat(emplacamentoElement.value);
    
    // Get subscription parcelas and monthly usage from selected car, based on period and usage
    let parcelas = 0;
    let usoMensal = 0;
    if (selectedCar) {
        const subscriptionKey = `${periodo}x${usoMensalElement.value}`; // e.g., "12x1000"
        parcelas = selectedCar[subscriptionKey] || 0;
        usoMensal = parseCurrencyToFloat(usoMensalElement.value);
    }

    // Set precoElement value to the 0km price of the selected car
    if (selectedCar) {
        precoElement.value = formatCurrency(preco0km);
        parcelasElement.value = formatCurrency(parcelas);

        // --- INÍCIO DA LÓGICA DE CÁLCULO DE MANUTENÇÃO ATUALIZADA ---
        let manutencao12_car = selectedCar?.['manutencao-12']*1 || 0;
        let manutencao24_car_incremental = selectedCar?.['manutencao-24']*1 || 0; // Custo incremental do ano 2
        let manutencao36_car_incremental = selectedCar?.['manutencao-36']*1 || 0; // Custo incremental do ano 3

        let totalManutencaoCumulative = 0;
        if (periodo <= 12) {
            totalManutencaoCumulative = manutencao12_car;
        } else if (periodo <= 24) {
            // Manutenção de 24 meses soma a de 12 meses
            totalManutencaoCumulative = manutencao12_car + manutencao24_car_incremental;
        } else if (periodo <= 36) {
            // Manutenção de 36 meses soma a de 12 e 24 meses (o 24 aqui é o incremental original do ano 2)
            totalManutencaoCumulative = manutencao12_car + manutencao24_car_incremental + manutencao36_car_incremental;
        } else {
            // Para períodos acima de 36 meses, consideramos o total acumulado até 36 meses
            // A taxa de 10% é um placeholder, idealmente seria fornecido mais dados para além de 36 meses
            totalManutencaoCumulative = manutencao12_car + manutencao24_car_incremental + manutencao36_car_incremental;
            // Se houver necessidade de calcular manutenção para períodos > 36 meses, uma lógica adicional seria necessária.
            // Por enquanto, mantém o total acumulado até 36 meses como teto.
        }

        // Calcula a média mensal da manutenção com base no total acumulado
        const manutencaoMonthlyAverage = (periodo > 0) ? totalManutencaoCumulative / periodo : 0;

        // Atualiza o campo de input de manutenção com a média mensal
        manutencaoElement.value = formatCurrency(manutencaoMonthlyAverage);

        // Atualiza a variável global manutencaoTotal com o valor acumulado
        manutencaoTotal = totalManutencaoCumulative;
        // --- FIM DA LÓGICA DE CÁLCULO DE MANUTENÇÃO ATUALIZADA ---

    } else {
        precoElement.value = formatCurrency(0);
        parcelasElement.value = formatCurrency(0);
        manutencaoElement.value = formatCurrency(0);
        manutencaoTotal = 0; // Reset total if no car selected
    }

    // A variável 'manutencao' será populada aqui com o valor atualizado do input
    const manutencao = parseCurrencyToFloat(manutencaoElement.value);

    // --- INÍCIO: CÁLCULO DE DEPRECIAÇÃO ATUALIZADO (ANO POR ANO) ---
    let totalDepreciacaoCalculated = 0; 
    let depreciacaoPrecoFinal = preco0km; // Inicializa com o preço 0km, será o valor final do carro

    if (selectedCar && preco0km > 0) {
        const numFullYearsInPeriod = periodo / 12;
        const remainingMonths = periodo % 12;

        console.group('Depreciação Ano a Ano');

        // `currentCarValueAfterDepreciation` é o valor do carro após a depreciação dos anos anteriores
        let currentCarValueAfterDepreciation = preco0km; 

        for (let year = 1; year <= numFullYearsInPeriod; year++) {
            console.log(`Ano ${year} (início): Valor do carro para depreciação = ${formatCurrency(currentCarValueAfterDepreciation)}`);

            const depreciationAmountThisYear = currentCarValueAfterDepreciation * (selectedCar['depreciacao-'+(year*12)] / 100);
            currentCarValueAfterDepreciation -= depreciationAmountThisYear; // Atualiza o valor do carro para o próximo cálculo

            console.log(`Ano ${year} (12 meses): Taxa de depreciação anual = ${formatPercentage(selectedCar['depreciacao-'+(year*12)])}, Valor depreciado neste ano = ${formatCurrency(depreciationAmountThisYear)}`);
        }

        // Trata o ano parcial restante, se houver
        if (remainingMonths > 0) {
            let annualDepreciationRateForPartialYear = 0;
            const currentYearNum = numFullYearsInPeriod + 1; // Este é o número do ano parcial

            console.log(`Ano ${currentYearNum} (início - parcial): Valor do carro para depreciação = ${formatCurrency(currentCarValueAfterDepreciation)}`);

            // Determina a taxa para o ano parcial com base na sua posição
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

        // Arredonda o valor final do carro para 2 casas decimais para evitar imprecisões de ponto flutuante
        depreciacaoPrecoFinal = parseFloat(currentCarValueAfterDepreciation.toFixed(2));
        // Calcula a depreciação total como a diferença exata entre o preço 0km e o preço final arredondado
        totalDepreciacaoCalculated = preco0km - depreciacaoPrecoFinal;
    } else {
        // Se nenhum carro selecionado ou preço 0km for zero, não há depreciação
        totalDepreciacaoCalculated = 0;
        depreciacaoPrecoFinal = preco0km; 
    }
    // --- FIM: CÁLCULO DE DEPRECIAÇÃO ATUALIZADO (ANO POR ANO) ---

    // Recalculate financial totals based on new data
    let currentCarValueForAnnualCalc = preco0km; // Value used as base for Seguro/IPVA calculation
    let totalSeguroPeriodo = 0;
    let totalIpvaPeriodo = 0;
    let totalLicenciamentoPeriodo = 0;
    let annualFinancialDetails = [];

    const fullYearsInPeriod = Math.floor(periodo / 12);
    const remainingMonthsInPartialYear = periodo % 12;

    console.group('Cálculo de Seguro, IPVA e Licenciamento por Período');
    console.log(`Valor inicial do carro para cálculo de despesas anuais: ${formatCurrency(preco0km)}`);

    for (let year = 0; year < fullYearsInPeriod; year++) {
        // Determine the car's value for this year's calculation based on cumulative depreciation percentages
        let valueForThisYear = preco0km;
        if (year === 0) {
            valueForThisYear = preco0km;
        } else if (year === 1 && selectedCar?.['depreciacao-12']) {
            valueForThisYear = preco0km * (1- (selectedCar['depreciacao-12'] / 100));
        } else if (year === 2 && selectedCar?.['depreciacao-24']) {
            valueForThisYear = preco0km * (1- (selectedCar['depreciacao-24'] / 100));
        }
        
        currentCarValueForAnnualCalc = valueForThisYear; // Update the base for the current year

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
        // For partial year, use the car value as determined at the start of that partial year's full year.
        // If it's the first year and less than 12 months, this would be preco0km.
        // Otherwise, it's the value after full years' depreciation.
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
    // manutencaoTotal já está definida acima com o valor acumulado
    entradaTotal = entradaPercentage * preco0km / 100;
    const valorFinanciado = preco0km - entradaTotal;
    
    const taxaMensalDecimal = taxaAM / 100;
    let parcelaMensal = 0;

    if (taxaMensalDecimal > 0 && periodo > 0) { // Ensure period is greater than 0 to avoid division by zero
        parcelaMensal = valorFinanciado * (taxaMensalDecimal * Math.pow((1 + taxaMensalDecimal), periodo)) / (Math.pow((1 + taxaMensalDecimal), periodo) - 1);
    } else if (periodo > 0) { // If no interest, simple division
        parcelaMensal = valorFinanciado / periodo; 
    } else {
        parcelaMensal = 0; // If period is 0, no monthly installment
    }

    const totalPagoComJuros = parcelaMensal * periodo;
    jurosTotal = totalPagoComJuros - valorFinanciado;
    // If valorFinanciado is 0 or negative (e.g., very high down payment), jurosTotal should be 0.
    if (valorFinanciado <= 0) {
        jurosTotal = 0;
    }
    const assinaturaTotal = parcelas * periodo; // Total cost of subscription installments
    const allCalculatedValuesForOpportunityCost = {
        seguroTotal: seguroTotal,
        ipvaTotal: ipvaTotal,
        manutencao: manutencao, // Monthly maintenance (average of cumulative total)
        licenciamentoValue: licenciamentoValue,
        emplacamentoValue: emplacamentoValue,
        parcelaMensal: parcelaMensal, // Monthly financing installment
        parcelas: parcelas, // Monthly subscription installment
        usoMensal: usoMensal // Monthly usage cost for subscription
    };

    const custoOportunidadeFinanciada = calculateOpportunityCost('financiada', entradaTotal, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeVista = calculateOpportunityCost('vista', preco0km*1, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);
    const custoOportunidadeAssinatura = calculateOpportunityCost('assinatura', null, periodo, anbimaData, allCalculatedValuesForOpportunityCost, annualFinancialDetails);

    // Update display elements
    periodoTotalElement.text(`${periodo}`);
    seguroTotalElement.text(formatCurrency(seguroTotal));
    ipvaTotalElement.text(formatCurrency(ipvaTotal));
    licenciamentoTotalElement.text(formatCurrency(totalLicenciamentoPeriodo));
    emplacamentoTotalElement.text(formatCurrency(emplacamentoValue));
    manutencaoAnoTotalElement.text(formatCurrency(manutencao * 12)); // Display annual average maintenance
    manutencaoTotalElement.text(formatCurrency(manutencaoTotal)); // Display total cumulative maintenance over period
    depreciacaoTotalElement.text(formatCurrency(totalDepreciacaoCalculated)); // This now shows the sum of annual depreciations
    depreciacaoPrecoElement.text(formatCurrency(depreciacaoPrecoFinal));
    entradaTotalElement.text(formatCurrency(entradaTotal));
    jurosTotalElement.text(formatCurrency(jurosTotal));
    jurosTaxaElement.text(`${taxaAM.toFixed(2).replace('.', ',')}%`);
    custoAssinaturaTotalElement.text(formatCurrency(assinaturaTotal));
    assinatura1_12TotalElement.text(formatCurrency(parcelas)); // Assuming this is monthly subscription cost
    precoTotalElement.text(formatCurrency(preco0km));
    custoOportunidadeFinanciadaTotalElement.text(formatCurrency(custoOportunidadeFinanciada));
    custoOportunidadeVistaTotalElement.text(formatCurrency(custoOportunidadeVista));
    custoOportunidadeAssinaturaTotalElement.text(formatCurrency(custoOportunidadeAssinatura));

    const financiadaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue + jurosTotal + custoOportunidadeFinanciada + totalDepreciacaoCalculated;
    financiadaTotalElement.text(formatCurrency(financiadaCalcTotal));

    console.log(seguroTotal, ipvaTotal, manutencaoTotal, totalLicenciamentoPeriodo, emplacamentoValue, jurosTotal, custoOportunidadeFinanciada, totalDepreciacaoCalculated);

    const vistaCalcTotal = seguroTotal + ipvaTotal + manutencaoTotal + totalLicenciamentoPeriodo + emplacamentoValue*1 + custoOportunidadeVista*1 + totalDepreciacaoCalculated;
    vistaTotalElement.text(formatCurrency(vistaCalcTotal));
    assinaturaTotalElement.text(formatCurrency(assinaturaTotal + custoOportunidadeAssinatura)); // Ensure usage cost is added to total subscription cost

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
    updateChartHeights();
}
