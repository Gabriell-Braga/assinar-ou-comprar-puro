$(document).ready(function(){
    window.dataLayer = window.dataLayer || [];

    $('#compare-button').on('click', function(){
        window.dataLayer.push({
            event: "inicio_calculadora"
        });
    });

    $('#modelo').on('change', function(){
        window.dataLayer.push({
            event: "selecao_veiculo",
            veiculo: this.value
        });
    });

    $('#periodo').on('change', function(){
        window.dataLayer.push({
            event: "selecao_periodo",
            periodo: this.value
        });
    });

    $('#uso_mensal').on('change', function(){
        window.dataLayer.push({
            event: "selecao_quilometragem",
            km: this.value
        });
    });

    $('#preco').on('focusout', function(){
        window.dataLayer.push({
            event: "selecao_preco",
            preco: this.value
        });
    });

    $('#next-button-1').on('click', function() {
        if(document.querySelector('#basic-form').checkValidity()){
            window.dataLayer.push({
                event: "calculadora_p1",
                preco: $('#preco').val(),
                km: $('#uso_mensal').val(),
                periodo: $('#periodo').val(),
                veiculo: $('#modelo').val()
            });
        }
    });

    $('#next-button-2').on('click', function() {
        if(document.querySelector('#complementary-form').checkValidity()){
            window.dataLayer.push({
                event: "calculadora_p2",
                entrada: $('#entrada').val(),
                porcentagem: $('#taxa_am').val()
            });

            dataLayer.push({
                event: "calculadora_concluida",
                valor_financiado: $('[data-total="financiada"]').first().text(),
                valor_vista: $('[data-total="vista"]').first().text(),
                valor_assinatura: $('[data-total="assinatura"]').first().text(),
            });
        }
    });

    $('#detailed-calculation-button').on('click', function() {
        dataLayer.push({
            event: "ver_calculo_detalhado"
        });
    });

    $('.calculo-select').on('change', function() {
        $('.calculo-select').val($(this).val());
        if($(this).val() === 'financiada'){
            dataLayer.push({
                event: "ver_calculo_financiado"
            });
        }else if($(this).val() === 'vista'){
            dataLayer.push({
                event: "ver_calculo_a_vista"
            });
        }
    });

    $('#quero-assinar-simples').on('click', function() {
        dataLayer.push({
            event: "calculadora_direcionamento",
            calculo: "simples",
            method: "quero-assinar"
        });
        editFormPayload("simples", "quero-assinar");
    });

    $('#total-detalhado').on('click', function() {
        dataLayer.push({
            event: "calculadora_direcionamento",
            calculo: "detalhado",
            method: "quero-assinar"
        });
        editFormPayload("detalhado", "quero-assinar");
    });

    $('#quero-assinar-mobile').on('click', function() {
        dataLayer.push({
            event: "calculadora_direcionamento",
            calculo: "detalhado",
            method: "quero-assinar"
        });
        editFormPayload("detalhado", "quero-assinar");
    });

    $('#email-simples').on('click', function() {
        dataLayer.push({
            event: "calculadora_direcionamento",
            calculo: "simples",
            method: "receber-email"
        });
        editFormPayload("simples", "receber-email");
    });

    $('#email-detalhado').on('click', function() {
        dataLayer.push({
            event: "calculadora_direcionamento",
            calculo: "detalhado",
            method: "receber-email"
        });
        editFormPayload("detalhado", "receber-email");
    });

    function editFormPayload(calculo, method){
        const selectedCar = $('#modelo').val() ? window.carros.find(car => car.slug === $('#modelo').val()) : null;
        let payload = {
            event: "begin_checkout",
            descricao: "form-calculadora",
            calculo: calculo,
            method: method,
            valor_financiado: $('[data-total="financiada"]').first().text(),
            valor_vista: $('[data-total="vista"]').first().text(),
            valor_assinatura: $('[data-total="assinatura"]').first().text(),
            ecommerce: {
                currency: "BRL",
                value: $('[data-total="assinatura_1_12"]').first().text(),
                    items: [{
                    item_name: selectedCar['modelo-do-veiculo'],
                    item_brand: selectedCar.marca,
                    item_category: selectedCar.versao,
                    price: selectedCar[$('#periodo').val()+'x'+$('#uso_mensal').val()],
                }]
            }
        }

        // console.log(payload);
        $('.form-unidas-403 form').attr('data-layer-form', JSON.stringify(payload));
    }
});