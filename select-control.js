function createCustomSelect(selectElement) {
  const $originalSelect = $(selectElement);
  
  // 1. Verifica e remove qualquer select customizado existente
  const existingCustomSelect = $originalSelect.prev('.custom-select-container');
  if (existingCustomSelect.length) {
    existingCustomSelect.remove();
    $originalSelect.show(); 
  }
  
  $originalSelect.hide(); // Esconde o select original

  // Cria o container do select personalizado
  const $customSelectContainer = $('<div/>', {
    class: 'custom-select-container relative w-full'
  });

  // Cria o botão que exibe o valor selecionado
  const $customSelectTrigger = $('<button/>', {
    type: 'button',
    class: 'bg-white block w-full text-[14px] text-[#212A3C] text-nowrap py-3 px-4 pr-8 border border-gray-300 rounded-md focus:ring-[#0066C2] focus:border-[#0066C2] transition duration-300 ease-in-out !outline-none text-left relative overflow-x-hidden',
    text: $originalSelect.find('option:selected').text()
  });

  // Adiciona a seta ao trigger
  const $arrow = $('<span/>', {
    class: 'absolute right-0 top-1/2 -translate-y-1/2 text-sm text-gray-400 bg-white pl-2 pr-4',
    html: '<i class="fas fa-chevron-down text-[#0066C2]"></i>'
  });
  $customSelectTrigger.append($arrow);

  // **Cria o wrapper para o scrollbar**
  const $customOptionsWrapper = $('<div/>', {
    class: 'absolute w-full rounded-md shadow-xl bg-white z-10 hidden mt-1 max-h-48 p-2'
  });
  
  // Cria a lista de opções (agora sem o overflow)
  const $customOptionsList = $('<ul/>', {
    class: 'custom-options-list max-h-44 overflow-y-auto'
  });

  // Preenche a lista com base nas opções do select original
  $originalSelect.find('option').each(function() {
    const $option = $(this);
    const $listItem = $('<li/>', {
      class: 'text-gray-700 block pl-2 py-2 text-sm cursor-pointer border-b last:border-0 border-[#D8DBE0] mr-2',
      text: $option.text(),
      'data-value': $option.val()
    });

    if ($option.is(':disabled')) {
      $listItem.addClass('disabled-option');
      $listItem.removeClass('hover:bg-gray-100 cursor-pointer');
    } else {
      $listItem.addClass('hover:bg-gray-100 cursor-pointer');
    }

    $customOptionsList.append($listItem);
  });
  
  // Adiciona a lista de opções ao wrapper
  $customOptionsWrapper.append($customOptionsList);

  // Adiciona os elementos ao contêiner
  $customSelectContainer.append($customSelectTrigger, $customOptionsWrapper);

  // Insere o novo select personalizado no DOM
  $originalSelect.before($customSelectContainer);

  // Adiciona listeners de eventos
  
  // 1. Alterna a visibilidade da lista de opções ao clicar no botão
  $customSelectTrigger.on('click', function(e) {
    // e.stopPropagation();
    // Fecha outros selects abertos
    $('.custom-options-list.active').not($customOptionsWrapper).removeClass('active');
    $customOptionsWrapper.toggleClass('active');
  });

  // 2. Lida com a seleção de uma opção na lista
  $customOptionsList.on('click', 'li:not(.disabled-option)', function() {
    const $selectedListItem = $(this);
    const selectedValue = $selectedListItem.data('value');
    const selectedText = $selectedListItem.text();

    $customSelectTrigger.text(selectedText).append($arrow);
    $originalSelect.val(selectedValue).trigger('change'); 

    // Fecha o dropdown
    $customOptionsWrapper.removeClass('active');
  });

  // 3. Fecha o dropdown se o usuário clicar fora do contêiner
  $(document).on('click', function(e) {
    if (!$customSelectContainer.is(e.target) && $customSelectContainer.has(e.target).length === 0) {
      $customOptionsWrapper.removeClass('active');
    }
  });
}