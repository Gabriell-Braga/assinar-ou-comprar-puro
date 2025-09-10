function createCustomSelect(selectElement) {
  const $originalSelect = $(selectElement);
  
  // 1. Verifica se já existe um select customizado para este elemento
  const existingCustomSelect = $originalSelect.prev('.custom-select-container');
  if (existingCustomSelect.length) {
    // Se existir, remove-o
    existingCustomSelect.remove();
    // Torna o select original visível novamente antes de escondê-lo de novo
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

  // Cria a lista de opções
  const $customOptionsList = $('<ul/>', {
    class: 'custom-options-list absolute w-full rounded-md shadow-xl bg-white z-10 hidden mt-1 max-h-48 overflow-y-auto'
  });

  // Preenche a lista com base nas opções do select original
  $originalSelect.find('option').each(function() {
    const $option = $(this);
    const $listItem = $('<li/>', {
      class: 'text-gray-700 block px-4 py-2 text-sm cursor-pointer border-b border-[#D8DBE0]',
      text: $option.text(),
      'data-value': $option.val()
    });

    // **Verifica se a opção está desabilitada**
    if ($option.is(':disabled')) {
      $listItem.addClass('disabled-option');
      $listItem.removeClass('hover:bg-gray-100 cursor-pointer');
    } else {
      $listItem.addClass('hover:bg-gray-100 cursor-pointer');
    }

    $customOptionsList.append($listItem);
  });

  // Adiciona os elementos ao container
  $customSelectContainer.append($customSelectTrigger, $customOptionsList);

  // Insere o novo select personalizado no DOM
  $originalSelect.before($customSelectContainer);

  // Adiciona listeners de eventos
  
  // 1. Alterna a visibilidade da lista de opções ao clicar no botão
  $customSelectTrigger.on('click', function(e) {
    e.stopPropagation();
    // Fecha outros selects abertos
    $('.custom-options-list.active').not($customOptionsList).removeClass('active');
    $customOptionsList.toggleClass('active');
  });

  // 2. Lida com a seleção de uma opção na lista
  $customOptionsList.on('click', 'li:not(.disabled-option)', function() {
    const $selectedListItem = $(this);
    const selectedValue = $selectedListItem.data('value');
    const selectedText = $selectedListItem.text();

    // Atualiza o texto do botão e o valor do select original escondido
    $customSelectTrigger.text(selectedText).append($arrow);
    $originalSelect.val(selectedValue);
    
    // **Gatilho 'change'** no select original para que outros scripts possam reagir
    $originalSelect.trigger('change'); 

    // Fecha o dropdown
    $customOptionsList.removeClass('active');
  });

  // 3. Fecha o dropdown se o usuário clicar fora do container
  $(document).on('click', function(e) {
    if (!$customSelectContainer.is(e.target) && $customSelectContainer.has(e.target).length === 0) {
      $customOptionsList.removeClass('active');
    }
  });
}