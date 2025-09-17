$(document).ready(function() {
    $('#compare-button').on('click', function() {
        window.scrollTo(0, 0);
        $('#banner').addClass('op-0 abs h-0');
        $('#calculator').removeClass('op-0 abs h-0');
    });

    $('#fixed-button').on('click', function() {
        window.scrollTo(0, 0);
        $('#banner').addClass('op-0 abs h-0');
        $('#calculator').removeClass('op-0 abs h-0');
    });

    $('#back-banner').on('click', function() {
        window.scrollTo(0, 0);
        $('#calculator').addClass('op-0 abs h-0');
        $('#banner').removeClass('op-0 abs h-0');
    });

    // Function to handle step transitions
    let url = '';
    function goToStep(stepId, menuStep) {
        if(menuStep === '#menu-step-1'){
            url = `${window.location.origin}${window.location.pathname}?carro=true`;
            window.history.pushState({ path: url }, '', url);
        }else if(menuStep === '#menu-step-2'){
            url = `${window.location.origin}${window.location.pathname}?valores=true`;
            window.history.pushState({ path: url }, '', url);
        }else if (stepId === '#result') {
            url = createShareUrl();
            window.history.pushState({ path: url }, '', url);
        }

        const currentStep = $('.step:not(.op-0)');
        const nextStep = $(stepId);

        window.scrollTo(0, 0);

        // Se o passo atual for o mesmo que o próximo, não faz nada
        if (currentStep.is(nextStep)) {
            return;
        }

        // Primeiro, inicia o fade-out do passo atual
        if (currentStep.length) {
            currentStep.addClass('op-0');
            setTimeout(() => {
                currentStep.addClass('abs');
                nextStep.removeClass('abs');
            }, 500);


            setTimeout(() => {
                nextStep.removeClass('op-0');
            }, 10);
        }

        if(menuStep == '#menu-step-1'){
            $('#menu-step-1').html('1');
            $('.menu-step:not(#menu-step-1)').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('.menu-step:not(#menu-step-1)').addClass('bg-white border border-[#616E84] text-[#616E84]');
            $('.back-to-step-1:has(#menu-step-1)').removeClass('cursor-pointer');
            
            $('#car-info').removeClass('my-3');
            $('#car-info').addClass('op-0 h-0');
            $('#anbima').addClass('op-0 h-0');
            $('#video-section').addClass('op-0 h-0');

            $('#calculator').addClass('bg-gradient-to-t');
        }else if(menuStep == '#menu-step-2'){
            $('#menu-step-1').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('#menu-step-1').addClass('bg-[#4DCB7B] text-white');
            $('#menu-step-1').html('<i class="fas fa-check"></i>');
            $('#menu-step-2').html('2');
            $('.back-to-step-1:has(#menu-step-1)').addClass('cursor-pointer');
            $('.back-to-step-2:has(#menu-step-2)').removeClass('cursor-pointer');
            $('.menu-step:not(#menu-step-2):not(#menu-step-1)').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('.menu-step:not(#menu-step-2):not(#menu-step-1)').addClass('bg-white border border-[#616E84] text-[#616E84]');

            $('#car-info').removeClass('my-3');
            $('#car-info').addClass('op-0 h-0');
            $('#anbima').addClass('op-0 h-0');
            $('#video-section').addClass('op-0 h-0');

            $('#calculator').addClass('bg-gradient-to-t');
        }else if(menuStep == '#menu-step-3'){
            $('.back-to-step-2:has(#menu-step-2)').addClass('cursor-pointer');
            $('#menu-step-2').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('#menu-step-2').addClass('bg-[#4DCB7B] text-white');
            $('#menu-step-2').html('<i class="fas fa-check"></i>');

            $('#car-info').addClass('my-3');
            $('#car-info').removeClass('op-0 h-0');
            $('#anbima').removeClass('op-0 h-0');
            $('#video-section').removeClass('op-0 h-0');

            $('#calculator').removeClass('bg-gradient-to-t');
        }
        $(menuStep).removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
        $(menuStep).addClass('bg-[#0066C2] text-white');
    }

    $('form').on('submit', function(event) {
        event.preventDefault();
    });

    $('#next-button-1').on('click', function() {
        if(document.querySelector('#basic-form').checkValidity()){
            goToStep('#step-2', '#menu-step-2');
        }
    });

    $('#next-button-2').on('click', function() {
        if(document.querySelector('#complementary-form').checkValidity()){
            goToStep('#result', '#menu-step-3');
        }
    });

    $('.back-to-step-1').on('click', function() {
        goToStep('#step-1', '#menu-step-1');
    });

    $('.back-to-step-2').on('click', function() {
        if(document.querySelector('#basic-form').checkValidity()){
            goToStep('#step-2', '#menu-step-2');
        }
    });


    $('.calculo-select').on('change', function() {
        $('.calculo-select').val($(this).val());
        const allSelects = document.querySelectorAll('select');
        allSelects.forEach(select => {
            createCustomSelect(select);
        });
        if($(this).val() === 'financiada'){
            $('.financiada-items').addClass('!flex');
            $('.vista-items').removeClass('!flex');
        }else if($(this).val() === 'vista'){
            $('.vista-items').addClass('!flex');
            $('.financiada-items').removeClass('!flex');
        }
    });


    // Switch between simple and detailed calculation
    $('.switch-buttons').on('click', function() {
        $('.switch-buttons').removeClass('active');
        $(this).addClass('active');
        if($(this).attr('id') === 'simple-calculation-button'){
            $('#detailed-calculation').addClass('op-0 abs mt-[53px]');
            $('#simple-calculation').removeClass('op-0 abs mt-[53px]');
        }else{
            $('#detailed-calculation').removeClass('op-0 abs mt-[53px]');
            $('#simple-calculation').addClass('op-0 abs mt-[53px]');
        }
    });

    $('.share-button').on('click', async function() {
        const shareUrl = createShareUrl();
        const shareTitle = document.title;
        const shareText = "Assinar ou Comprar? Confira o que vale mais a pena!"; // Você pode personalizar este texto

        // 1. Verifica se a Web Share API é suportada pelo navegador
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });
                console.log('Conteúdo compartilhado com sucesso!');
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
                // O erro pode ser causado pelo usuário cancelar a operação.
            }
        } else {
            // 2. Fallback: Se a API não for suportada, copia o link para a área de transferência
            try {
                await navigator.clipboard.writeText(shareUrl);

                // Cria e exibe o alerta de "Link copiado!"
                const alertDiv = $('<div>', {
                    text: 'Link copiado!',
                    css: {
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#0066C2',
                        color: '#FEFEFE',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        zIndex: '1000',
                        opacity: '0',
                        transition: 'opacity 0.5s ease-in-out',
                        fontWeight: '600',
                        fontSize: '14px',
                    }
                }).appendTo('body');

                setTimeout(() => {
                    alertDiv.css('opacity', '1');
                }, 10);

                setTimeout(() => {
                    alertDiv.css('opacity', '0');
                    setTimeout(() => {
                        alertDiv.remove();
                    }, 500);
                }, 3000);

                console.log('Link copiado para a área de transferência.');
            } catch (error) {
                console.error('Falha ao copiar o link:', error);
                alert('Falha ao copiar o link. Tente novamente.');
            }
        }
    });

    // TOTAL FIXADO MOBILE
    const totalDetalhado = $('#total-detalhado');
    const totalFixed = $('#total-fixed');

    const fixedButton = $('#fixed-button');
    const banner = $('#banner');
    const calculator = $('#calculator');

    if (totalDetalhado.length && totalFixed.length) {
        $(window).on('scroll', function() {
            const windowScrollBottom = $(window).scrollTop() + $(window).height();
            const totalDetalhadoTop = totalDetalhado.offset().top;

            if (windowScrollBottom >= totalDetalhadoTop) {
                totalFixed.addClass('opacity-0 pointer-events-none');
            } else {
                totalFixed.removeClass('opacity-0 pointer-events-none');
            }

            if($(window).scrollTop() >= (banner.offset().top + banner.outerHeight(true)) && $(window).scrollTop() >= (calculator.offset().top + calculator.outerHeight(true))){
                fixedButton.removeClass('op-0');
            }else{
                fixedButton.addClass('op-0');
            }
        });
    }
});

/**
 * Creates the URL with all form parameters.
 * @returns {string} The formatted URL with query parameters.
 */
function createShareUrl() {
    const modeloSlug = $('#modelo').val();
    const periodo = $('#periodo').val();
    const usoMensal = $('#uso_mensal').val();
    const seguro = parseFloat($('#seguro').val().replace(',', '.').replace('%', ''));
    const ipva = parseFloat($('#ipva').val().replace(',', '.').replace('%', ''));
    const licenciamento = parseFloat($('#licenciamento').val().replace('R$', '').replace(/\./g, '').replace(',', '.'));
    const emplacamento = parseFloat($('#emplacamento').val().replace('R$', '').replace(/\./g, '').replace(',', '.'));
    const manutencao = parseFloat($('#manutencao').val().replace('R$', '').replace(/\./g, '').replace(',', '.'));
    const entrada = parseFloat($('#entrada').val().replace(',', '.').replace('%', ''));
    const taxaAM = parseFloat($('#taxa_am').val().replace(',', '.').replace('%', ''));

    // Cria os parâmetros de URL
    const params = new URLSearchParams();
    if (modeloSlug) params.set('modelo', modeloSlug);
    if (periodo) params.set('periodo', periodo);
    if (usoMensal) params.set('uso_mensal', usoMensal);
    if (!isNaN(seguro)) params.set('seguro', seguro);
    if (!isNaN(ipva)) params.set('ipva', ipva);
    if (!isNaN(licenciamento)) params.set('licenciamento', licenciamento);
    if (!isNaN(emplacamento)) params.set('emplacamento', emplacamento);
    if (!isNaN(manutencao)) params.set('manutencao', manutencao);
    if (!isNaN(entrada)) params.set('entrada', entrada);
    if (!isNaN(taxaAM)) params.set('taxa_am', taxaAM);
    params.set('pular', 'true');

    console.log(window.location.origin);
    console.log(window.location.pathname);
    console.log(params.toString());

    // Retorna a URL completa
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

// TOOLTIP CONTROL
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os elementos com a classe .tooltip-container
    const tooltips = document.querySelectorAll('.tooltip-container');

    tooltips.forEach(container => {
        const tooltip = container.querySelector('.tooltip-content');

        // Adiciona um evento de mouseover para cada container
        container.addEventListener('mouseover', () => {
            // Obtém as dimensões do container e do tooltip
            const containerRect = container.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            // Calcula a posição do lado direito do tooltip
            const tooltipRight = containerRect.left + (containerRect.width / 2) + (tooltipRect.width / 2);

            // Calcula a largura da janela de visualização
            const viewportWidth = window.innerWidth;

            // Verifica se o tooltip irá para fora da tela (se a borda direita ultrapassa a largura da janela)
            if (tooltipRight > viewportWidth) {
                // Adiciona a classe 'left-aligned' para reposicionar o tooltip
                tooltip.classList.add('left-aligned');
            } else {
                // Remove a classe 'left-aligned' se o tooltip estiver dentro da tela
                tooltip.classList.remove('left-aligned');
            }
        });
    });
});