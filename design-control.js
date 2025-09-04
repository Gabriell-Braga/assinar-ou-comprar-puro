$(document).ready(function() {
    function goToStep(stepId, menuStep) {
        $('.step').addClass('hidden');
        $(stepId).removeClass('hidden');

        if(menuStep == '#menu-step-1'){
            $('#menu-step-1').html('1');
            $('.menu-step:not(#menu-step-1)').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('.menu-step:not(#menu-step-1)').addClass('bg-white border border-[#616E84] text-[#616E84]');
            $('.back-to-step-1:has(#menu-step-1)').removeClass('cursor-pointer');
            $('#anbima').addClass('hidden');
        }else if(menuStep == '#menu-step-2'){
            $('#menu-step-1').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('#menu-step-1').addClass('bg-[#4DCB7B] text-white');
            $('#menu-step-1').html('<i class="fa-solid fa-check"></i>');
            $('#menu-step-2').html('2');
            $('.back-to-step-1:has(#menu-step-1)').addClass('cursor-pointer');
            $('.back-to-step-2:has(#menu-step-2)').removeClass('cursor-pointer');
            $('.menu-step:not(#menu-step-2):not(#menu-step-1)').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('.menu-step:not(#menu-step-2):not(#menu-step-1)').addClass('bg-white border border-[#616E84] text-[#616E84]');
            $('#anbima').addClass('hidden');
        }else if(menuStep == '#menu-step-3'){
            $('.back-to-step-2:has(#menu-step-2)').addClass('cursor-pointer');
            $('#menu-step-2').removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
            $('#menu-step-2').addClass('bg-[#4DCB7B] text-white');
            $('#menu-step-2').html('<i class="fa-solid fa-check"></i>');
            $('#anbima').removeClass('hidden');
        }
        $(menuStep).removeClass('bg-[#0066C2] text-white bg-white border border-[#616E84] text-[#616E84]');
        $(menuStep).addClass('bg-[#0066C2] text-white');
    }

    $('#basic-form').on('submit', function(event) {
        event.preventDefault();
        if (this.checkValidity()) {
            goToStep('#step-2', '#menu-step-2');
        } else {
            console.log('Formulário inválido!');
        }
    });

    $('#complementary-form').on('submit', function(event) {
        event.preventDefault();
        if (this.checkValidity()) {
            goToStep('#result', '#menu-step-3');
        } else {
            console.log('Formulário complementar inválido!');
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
            $('#detailed-calculation').addClass('hidden');
            $('#simple-calculation').removeClass('hidden');
        }else{
            $('#detailed-calculation').removeClass('hidden');
            $('#simple-calculation').addClass('hidden');
        }
    });
});
