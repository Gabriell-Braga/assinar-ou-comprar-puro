$(document).ready(function() {
    // Evento de clique no botão de submit
    $('#submit-button').click(function(event) {
        event.preventDefault();
        if ($('#basic-form')[0].checkValidity()) {
            // Se o formulário for válido, envie os dados
            const formData = {
                modelo: $('#modelo').val(),
                periodo: $('#periodo').val(),
                uso_mensal: $('#uso_mensal').val(),
                preco: $('#preco').val()
            };

            
        }
    });
});
