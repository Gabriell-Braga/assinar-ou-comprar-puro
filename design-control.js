$(document).ready(function() {
    function goToStep(stepId, menuStep) {
        const currentStep = $('.step:not(.op-0)');
        const nextStep = $(stepId);

        console.log('Current Step:', currentStep.attr('id'));
        console.log('Next Step:', nextStep.attr('id'));
        console.log(currentStep.is(nextStep) ? 'Same step' : 'Different step');

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
            
            $('#car-info').addClass('op-0 h-0');
            $('#anbima').addClass('op-0 h-0');
        }else if(menuStep == '#menu-step-2'){
            $('#menu-step-1').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('#menu-step-1').addClass('bg-[#4DCB7B] text-white');
            $('#menu-step-1').html('<i class="fas fa-check"></i>');
            $('#menu-step-2').html('2');
            $('.back-to-step-1:has(#menu-step-1)').addClass('cursor-pointer');
            $('.back-to-step-2:has(#menu-step-2)').removeClass('cursor-pointer');
            $('.menu-step:not(#menu-step-2):not(#menu-step-1)').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('.menu-step:not(#menu-step-2):not(#menu-step-1)').addClass('bg-white border border-[#616E84] text-[#616E84]');
            
            $('#car-info').addClass('op-0 h-0');
            $('#anbima').addClass('op-0 h-0');
        }else if(menuStep == '#menu-step-3'){
            $('.back-to-step-2:has(#menu-step-2)').addClass('cursor-pointer');
            $('#menu-step-2').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('#menu-step-2').addClass('bg-[#4DCB7B] text-white');
            $('#menu-step-2').html('<i class="fas fa-check"></i>');

            $('#car-info').removeClass('op-0 h-0');
            $('#anbima').removeClass('op-0 h-0');
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

    $('#share').on('click', async function() {
        const url = window.location.href;

        try {
            await navigator.clipboard.writeText(url);
            
            // Cria o elemento de alerta personalizado
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
                    fontWeight: 'semibold',
                    fontSize: '14px',
                }
            }).appendTo('body');

            // Exibe o alerta com um fade-in
            setTimeout(() => {
                alertDiv.css('opacity', '1');
            }, 10);

            // Remove o alerta após 3 segundos
            setTimeout(() => {
                alertDiv.css('opacity', '0');
                setTimeout(() => {
                    alertDiv.remove();
                }, 500);
            }, 3000);

        } catch (error) {
            console.error('Falha ao copiar o link:', error);
            alert('Falha ao copiar o link. Tente novamente.');
        }
    });
});
