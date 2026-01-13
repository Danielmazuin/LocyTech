// ==================== ADMIN VERIFICAÇÃO ====================

// Verificar se o usuário está logado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('admin_logado') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    carregarProdutosAdmin();
    carregarDashboard();
    carregarConfiguracoesAdmin();
    carregarVendas();
    carregarSelectProdutos();
    
    // Mostrar primeira seção
    mostrarSecao('dashboard');

    // Definir data atual no formulário de venda
    const dataAtual = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('venda-data');
    if (inputData) inputData.value = dataAtual;
});

// ==================== NAVEGAÇÃO ====================

function mostrarSecao(secaoId) {
    // Ocultar todas as seções
    document.querySelectorAll('.secao-admin').forEach(secao => {
        secao.classList.remove('active');
    });

    // Remover active de todos os menus
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Mostrar seção selecionada
    document.getElementById(secaoId).classList.add('active');

    // Adicionar active ao menu correspondente
    event.target.closest('.menu-item').classList.add('active');
}

// ==================== DASHBOARD ====================

function carregarDashboard() {
    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    const vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];

    document.getElementById('total-produtos').textContent = produtos.length;
    document.getElementById('total-pedidos').textContent = vendas.length;

    // Calcular total de vendas
    const totalVendas = vendas.reduce((sum, venda) => sum + (venda.total || 0), 0);
    document.getElementById('total-vendas').textContent = `R$ ${totalVendas.toFixed(2).replace('.', ',')}`;

    // Contar clientes únicos
    const clientes = new Set(vendas.map(v => v.cliente || 'desconhecido'));
    document.getElementById('total-clientes').textContent = clientes.size;

    // Mostrar últimos pedidos
    const ultimasVendas = vendas.slice(-5).reverse();
    const listaPedidos = document.getElementById('lista-ultimos-pedidos');

    if (ultimasVendas.length === 0) {
        listaPedidos.innerHTML = '<p style="text-align: center; color: #999;">Nenhuma venda registrada</p>';
    } else {
        listaPedidos.innerHTML = ultimasVendas.map(venda => `
            <div class="item-pedido-resumo">
                <div class="pedido-info">
                    <h4>${venda.data || 'Data desconhecida'}</h4>
                    <p>${venda.itens?.length || 0} produto(s)</p>
                </div>
                <div class="pedido-valor">R$ ${(venda.total || 0).toFixed(2).replace('.', ',')}</div>
            </div>
        `).join('');
    }

    // Atualizar financeiro
    document.getElementById('fin-total-vendas').textContent = `R$ ${totalVendas.toFixed(2).replace('.', ',')}`;
    document.getElementById('fin-num-pedidos').textContent = vendas.length;
    
    const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;
    document.getElementById('fin-ticket-medio').textContent = `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;

    // Carregar histórico de vendas
    carregarHistoricoVendas(vendas);
}

function carregarHistoricoVendas(vendas) {
    const corpo = document.getElementById('corpo-financeiro');
    
    if (vendas.length === 0) {
        corpo.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhuma venda registrada</td></tr>';
        return;
    }

    corpo.innerHTML = vendas.map(venda => `
        <tr>
            <td>${venda.data || '-'}</td>
            <td>${venda.cliente || 'Desconhecido'}</td>
            <td>${venda.itens?.map(i => i.nome).join(', ') || '-'}</td>
            <td>${venda.itens?.reduce((sum, i) => sum + i.quantidade, 0) || 0}</td>
            <td>R$ ${(venda.total || 0).toFixed(2).replace('.', ',')}</td>
        </tr>
    `).join('');
}

// ==================== PRODUTOS ====================

function carregarProdutosAdmin() {
    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    const corpo = document.getElementById('corpo-tabela');

    if (produtos.length === 0) {
        corpo.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhum produto cadastrado</td></tr>';
        return;
    }

    let html = '';
    produtos.forEach(produto => {
        const temImagem = produto.imagem && (String(produto.imagem).startsWith('data:image') || String(produto.imagem).startsWith('http'));
        const imagemHtml = temImagem
            ? `<img src="${produto.imagem}" alt="${produto.nome}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">`
            : `<div style="font-size: 2rem;">${produto.imagem || '📦'}</div>`;

        html += `
        <tr>
            <td>${imagemHtml}</td>
            <td><strong>${produto.nome}</strong></td>
            <td><span style="background: var(--background); padding: 0.3rem 0.8rem; border-radius: 20px;">${produto.categoria}</span></td>
            <td><strong>R$ ${produto.preco.toFixed(2).replace('.', ',')}</strong></td>
            <td>${produto.estoque || 0} unidades</td>
            <td>
                <div class="acoes-btn">
                    <button class="btn-editar" onclick="editarProduto(${produto.id})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-deletar-tabela" onclick="deletarProdutoAdmin(${produto.id})"><i class="fas fa-trash"></i> Deletar</button>
                </div>
            </td>
        </tr>`;
    });

    corpo.innerHTML = html;
}

function abrirFormAdicionar() {
    // Limpar formulário
    document.getElementById('form-produto').reset();
    document.getElementById('form-titulo').textContent = 'Novo Produto';
    document.getElementById('form-container').style.display = 'block';
    document.getElementById('preview-imagem').style.display = 'none';
    
    // Adicionar uma cor padrão
    const coresContainer = document.getElementById('cores-container');
    coresContainer.innerHTML = `
        <div class="cor-item">
            <input type="text" placeholder="Nome da cor (ex: Vermelho)" class="input-cor-nome">
            <input type="color" class="input-cor-picker">
            <button type="button" onclick="removerCor(this)" class="btn-remover-cor"><i class="fas fa-trash"></i></button>
        </div>
    `;

    // Scroll para formulário
    document.getElementById('form-container').scrollIntoView({ behavior: 'smooth' });

    // Limpar ID de edição
    document.getElementById('form-produto').dataset.productId = '';
}

function fecharFormAdicionar() {
    document.getElementById('form-container').style.display = 'none';
}

function adicionarCor() {
    const coresContainer = document.getElementById('cores-container');
    const novaCor = document.createElement('div');
    novaCor.className = 'cor-item';
    novaCor.innerHTML = `
        <input type="text" placeholder="Nome da cor (ex: Azul)" class="input-cor-nome">
        <input type="color" class="input-cor-picker" value="#000000">
        <button type="button" onclick="removerCor(this)" class="btn-remover-cor"><i class="fas fa-trash"></i></button>
    `;
    coresContainer.appendChild(novaCor);
}

function removerCor(btn) {
    btn.closest('.cor-item').remove();
}

function salvarProduto(event) {
    event.preventDefault();

    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    
    // Coletar cores
    const cores = [];
    document.querySelectorAll('#cores-container .cor-item').forEach(item => {
        const nome = item.querySelector('.input-cor-nome').value;
        const cor = item.querySelector('.input-cor-picker').value;
        if (nome) {
            cores.push({ nome, cor });
        }
    });

    const novoId = document.getElementById('form-produto').dataset.productId || 
                   (Math.max(...produtos.map(p => p.id), 0) + 1);

    const preco = parseFloat(document.getElementById('prod-preco').value);
    const custo = parseFloat(document.getElementById('prod-custo').value);
    const margemLucro = ((preco - custo) / preco * 100).toFixed(2);

    const novoProduto = {
        id: parseInt(novoId),
        nome: document.getElementById('prod-nome').value,
        descricao: document.getElementById('prod-desc').value,
        preco: preco,
        custo: custo,
        precoPromo: parseFloat(document.getElementById('prod-preco-promo').value) || 0,
        categoria: document.getElementById('prod-categoria').value,
        estoque: parseInt(document.getElementById('prod-estoque').value) || 0,
        imagem: document.getElementById('prod-imagem-file').dataset.base64 || '📦',
        cores: cores,
        dimensoes: {
            largura: parseFloat(document.getElementById('prod-largura').value) || null,
            altura: parseFloat(document.getElementById('prod-altura').value) || null,
            comprimento: parseFloat(document.getElementById('prod-comprimento').value) || null,
            peso: parseFloat(document.getElementById('prod-peso').value) || null
        },
        margemLucro: margemLucro,
        lucroPorUnidade: (preco - custo).toFixed(2)
    };

    // Verificar se é edição
    const indiceExistente = produtos.findIndex(p => p.id === novoProduto.id);
    if (indiceExistente !== -1) {
        produtos[indiceExistente] = novoProduto;
        mostrarNotificacao('Produto atualizado com sucesso! ✅');
    } else {
        produtos.push(novoProduto);
        mostrarNotificacao('Produto adicionado com sucesso! ✅');
    }

    localStorage.setItem('produtos_donalu', JSON.stringify(produtos));
    carregarProdutosAdmin();
    carregarSelectProdutos();
    // Enviar para Google Sheets (se configurado)
    postToSheets('produto', novoProduto);
    fecharFormAdicionar();
}

function editarProduto(id) {
    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    const produto = produtos.find(p => p.id === id);

    if (produto) {
        document.getElementById('form-titulo').textContent = 'Editar Produto';
        document.getElementById('prod-nome').value = produto.nome;
        document.getElementById('prod-desc').value = produto.descricao;
        document.getElementById('prod-preco').value = produto.preco;
        document.getElementById('prod-custo').value = produto.custo || 0;
        document.getElementById('prod-preco-promo').value = produto.precoPromo || 0;
        document.getElementById('prod-categoria').value = produto.categoria;
        document.getElementById('prod-estoque').value = produto.estoque || 0;
        document.getElementById('prod-largura').value = produto.dimensoes?.largura || '';
        document.getElementById('prod-altura').value = produto.dimensoes?.altura || '';
        document.getElementById('prod-comprimento').value = produto.dimensoes?.comprimento || '';
        document.getElementById('prod-peso').value = produto.dimensoes?.peso || '';
        
        // Carregar cores
        const coresContainer = document.getElementById('cores-container');
        if (produto.cores && produto.cores.length > 0) {
            coresContainer.innerHTML = produto.cores.map(cor => `
                <div class="cor-item">
                    <input type="text" placeholder="Nome da cor" class="input-cor-nome" value="${cor.nome}">
                    <input type="color" class="input-cor-picker" value="${cor.cor}">
                    <button type="button" onclick="removerCor(this)" class="btn-remover-cor"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        }

        document.getElementById('form-produto').dataset.productId = id;
        document.getElementById('form-container').style.display = 'block';
        document.getElementById('form-container').scrollIntoView({ behavior: 'smooth' });
    }
}

function deletarProdutoAdmin(id) {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
        let produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
        produtos = produtos.filter(p => p.id !== id);
        localStorage.setItem('produtos_donalu', JSON.stringify(produtos));
        carregarProdutosAdmin();
        carregarSelectProdutos();
        mostrarNotificacao('Produto deletado com sucesso! ✅');
    }
}

// Monitorar mudanças nos preços para calcular margem
document.addEventListener('change', (e) => {
    if (e.target.id === 'prod-preco' || e.target.id === 'prod-custo') {
        const preco = parseFloat(document.getElementById('prod-preco').value) || 0;
        const custo = parseFloat(document.getElementById('prod-custo').value) || 0;
        
        if (preco > 0 && custo > 0) {
            const margem = ((preco - custo) / preco * 100).toFixed(2);
            const lucro = (preco - custo).toFixed(2);
            
            const infoMargem = document.getElementById('margem-info');
            infoMargem.style.display = 'block';
            document.getElementById('margem-percentual').textContent = `${margem}%`;
            document.getElementById('lucro-unitario').textContent = lucro.replace('.', ',');
        }
    }
});

// ==================== VENDAS ====================

function carregarSelectProdutos() {
    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    const select = document.getElementById('venda-produto-select');
    
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um produto</option>' + 
        produtos.map(p => `<option value="${p.id}" data-preco="${p.preco}">${p.nome}</option>`).join('');
}

function carregarVariacoesProduto() {
    const select = document.getElementById('venda-produto-select');
    const selectCor = document.getElementById('venda-cor-select');
    const inputPreco = document.getElementById('venda-preco-item');
    
    if (!select.value) {
        selectCor.innerHTML = '<option value="">Sem variação</option>';
        inputPreco.value = '';
        return;
    }

    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    const produto = produtos.find(p => p.id == select.value);

    inputPreco.value = produto.preco.toFixed(2);

    if (produto.cores && produto.cores.length > 0) {
        selectCor.innerHTML = '<option value="">Sem variação</option>' +
            produto.cores.map(cor => `<option value="${cor.nome}">${cor.nome}</option>`).join('');
    } else {
        selectCor.innerHTML = '<option value="">Sem variação</option>';
    }
}

function adicionarItemVenda() {
    const selectProduto = document.getElementById('venda-produto-select');
    const selectCor = document.getElementById('venda-cor-select');
    const quantidade = parseFloat(document.getElementById('venda-quantidade').value) || 1;
    const preco = parseFloat(document.getElementById('venda-preco-item').value) || 0;

    if (!selectProduto.value || preco === 0) {
        alert('Selecione um produto com preço válido!');
        return;
    }

    const produtos = JSON.parse(localStorage.getItem('produtos_donalu')) || [];
    const produto = produtos.find(p => p.id == selectProduto.value);

    let itensVenda = JSON.parse(sessionStorage.getItem('itens_venda_temp')) || [];
    
    itensVenda.push({
        produtoId: produto.id,
        id: produto.id,
        nome: produto.nome,
        cor: selectCor.value || 'Sem variação',
        quantidade: quantidade,
        precoUnitario: preco,
        preco: preco,
        subtotal: preco * quantidade
    });

    sessionStorage.setItem('itens_venda_temp', JSON.stringify(itensVenda));
    exibirItensVenda();
    calcularTotalVenda();

    // Limpar campos
    document.getElementById('venda-quantidade').value = '1';
    selectProduto.value = '';
    selectCor.innerHTML = '<option value="">Sem variação</option>';
    document.getElementById('venda-preco-item').value = '';
}

function exibirItensVenda() {
    const itens = JSON.parse(sessionStorage.getItem('itens_venda_temp')) || [];
    const container = document.getElementById('itens-venda-container');

    if (itens.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Nenhum item adicionado</p>';
        return;
    }

    container.innerHTML = itens.map((item, index) => `
        <div class="item-venda">
            <div class="item-venda-info">
                <div class="item-venda-nome">${item.nome}</div>
                <div class="item-venda-detalhes">
                    ${item.cor !== 'Sem variação' ? `Cor: ${item.cor} | ` : ''}
                    Quantidade: ${item.quantidade} | Preço Unit.: R$ ${item.preco.toFixed(2).replace('.', ',')}
                </div>
            </div>
            <div class="item-venda-preco">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</div>
            <div class="item-venda-actions">
                <button type="button" class="btn-editar-item" onclick="editarItemVenda(${index})" title="Editar"><i class="fas fa-edit"></i></button>
                <button type="button" class="btn-remover-item" onclick="removerItemVenda(${index})" title="Remover"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function removerItemVenda(index) {
    let itens = JSON.parse(sessionStorage.getItem('itens_venda_temp')) || [];
    itens.splice(index, 1);
    sessionStorage.setItem('itens_venda_temp', JSON.stringify(itens));
    exibirItensVenda();
    calcularTotalVenda();
}

function calcularTotalVenda() {
    const itens = JSON.parse(sessionStorage.getItem('itens_venda_temp')) || [];
    const subtotal = itens.reduce((sum, item) => sum + item.subtotal, 0);
    const desconto = (parseFloat(document.getElementById('venda-desconto').value) || 0) / 100;
    const total = subtotal - (subtotal * desconto);

    document.getElementById('venda-subtotal').textContent = subtotal.toFixed(2).replace('.', ',');
    document.getElementById('venda-total').textContent = total.toFixed(2).replace('.', ',');
}

function abrirFormVenda() {
    sessionStorage.removeItem('itens_venda_temp');
    document.getElementById('form-venda').reset();
    const dataAtual = new Date().toISOString().split('T')[0];
    document.getElementById('venda-data').value = dataAtual;
    document.getElementById('form-venda-container').style.display = 'block';
    exibirItensVenda();
    document.getElementById('form-venda-container').scrollIntoView({ behavior: 'smooth' });
}

function fecharFormVenda() {
    document.getElementById('form-venda-container').style.display = 'none';
    sessionStorage.removeItem('itens_venda_temp');
}

function salvarVenda(event) {
    event.preventDefault();

    const itens = JSON.parse(sessionStorage.getItem('itens_venda_temp')) || [];
    if (itens.length === 0) {
        alert('Adicione pelo menos um item à venda!');
        return;
    }

    // Validar método de pagamento
    const pagamentoSelecionado = document.getElementById('venda-pagamento').value;
    if (!pagamentoSelecionado) {
        alert('Selecione o método de pagamento.');
        return;
    }

    const vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];
    
    const subtotal = itens.reduce((sum, item) => sum + item.subtotal, 0);
    const desconto = (parseFloat(document.getElementById('venda-desconto').value) || 0) / 100;
    const total = subtotal - (subtotal * desconto);

    const novaVenda = {
        id: Math.max(...vendas.map(v => v.id || 0), 0) + 1,
        data: document.getElementById('venda-data').value,
        cliente: document.getElementById('venda-cliente').value || 'Cliente Anônimo',
        pagamento: pagamentoSelecionado,
        itens: itens,
        subtotal: subtotal,
        desconto: (subtotal * desconto).toFixed(2),
        total: total.toFixed(2),
        timestamp: new Date().toISOString()
    };

    vendas.push(novaVenda);
    localStorage.setItem('vendas_donalu', JSON.stringify(vendas));
    // Enviar para Google Sheets (se configurado)
    postToSheets('venda', novaVenda);

    mostrarNotificacao('Venda registrada com sucesso! ✅');
    fecharFormVenda();
    carregarVendas();
    carregarDashboard();
}

function carregarVendas() {
    const vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];
    exibirTabelaVendas(vendas);
}

function exibirTabelaVendas(vendas) {
    const corpo = document.getElementById('corpo-vendas');

    if (vendas.length === 0) {
        corpo.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">Nenhuma venda registrada</td></tr>';
        return;
    }

    corpo.innerHTML = vendas.map(venda => `
        <tr>
            <td>${venda.data}</td>
            <td>${venda.cliente}</td>
            <td>${venda.itens.length} produto(s)</td>
            <td>${venda.pagamento}</td>
            <td>R$ ${parseFloat(venda.subtotal).toFixed(2).replace('.', ',')}</td>
            <td>R$ ${parseFloat(venda.desconto || 0).toFixed(2).replace('.', ',')}</td>
            <td><strong>R$ ${parseFloat(venda.total).toFixed(2).replace('.', ',')}</strong></td>
            <td>
                <button class="btn-ver-venda" onclick="verDetalheVenda(${venda.id})"><i class="fas fa-eye"></i></button>
                <button class="btn-deletar-venda" onclick="deletarVenda(${venda.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function verDetalheVenda(vendaId) {
    const vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];
    const venda = vendas.find(v => v.id === vendaId);

    if (venda) {
        alert(`Venda #${venda.id}\nData: ${venda.data}\nCliente: ${venda.cliente}\nTotal: R$ ${venda.total}`);
    }
}

function deletarVenda(vendaId) {
    if (confirm('Tem certeza que deseja deletar esta venda?')) {
        let vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];
        vendas = vendas.filter(v => v.id !== vendaId);
        localStorage.setItem('vendas_donalu', JSON.stringify(vendas));
        carregarVendas();
        carregarDashboard();
        mostrarNotificacao('Venda deletada com sucesso! ✅');
    }
}

function filtrarVendas() {
    const data = document.getElementById('filtro-venda-data').value;
    const metodo = document.getElementById('filtro-venda-metodo').value;
    
    let vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];
    
    if (data) {
        vendas = vendas.filter(v => v.data === data);
    }
    
    if (metodo) {
        vendas = vendas.filter(v => v.pagamento === metodo);
    }

    exibirTabelaVendas(vendas);
}

function exportarVendas() {
    const vendas = JSON.parse(localStorage.getItem('vendas_donalu')) || [];
    
    if (vendas.length === 0) {
        alert('Nenhuma venda para exportar!');
        return;
    }

    let csv = 'Data,Cliente,Produtos,Método Pagamento,Subtotal,Desconto,Total\n';
    
    vendas.forEach(venda => {
        const produtos = venda.itens.map(i => i.nome).join(';');
        csv += `"${venda.data}","${venda.cliente}","${produtos}","${venda.pagamento}","${venda.subtotal}","${venda.desconto || 0}","${venda.total}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ==================== UPLOAD DE IMAGEM ====================

const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('prod-imagem-file');

if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(212, 165, 116, 0.2)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = 'var(--background)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'var(--background)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processarArquivo(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processarArquivo(e.target.files[0]);
        }
    });
}

function processarArquivo(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const base64 = e.target.result;
        document.getElementById('prod-imagem-file').dataset.base64 = base64;
        
        // Mostrar preview
        const preview = document.getElementById('preview-imagem');
        preview.src = base64;
        preview.style.display = 'block';
    };

    reader.readAsDataURL(file);
}

// ==================== LOGOUT ====================

function fazerLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('admin_logado');
        window.location.href = 'index.html';
    }
}

// ==================== CONFIGURAÇÕES ====================

function carregarConfiguracoesAdmin() {
    const configs = JSON.parse(localStorage.getItem('config_donalu')) || {};
    
    document.getElementById('config-whatsapp').value = configs.whatsapp || '+55 51 99583-7023';
    document.getElementById('config-email').value = configs.email || '';
    document.getElementById('config-horario-seg-sex').value = configs.horarioSegSex || '09:00 - 18:30';
    document.getElementById('config-horario-sab').value = configs.horarioSab || '09:00 - 13:00';
    if (document.getElementById('config-sheets-endpoint')) {
        const endpoint = configs.sheetsEndpoint || SHEETS_DEFAULT_ENDPOINT || '';
        document.getElementById('config-sheets-endpoint').value = endpoint;
        if (!configs.sheetsEndpoint) {
            configs.sheetsEndpoint = endpoint;
            localStorage.setItem('config_donalu', JSON.stringify(configs));
        }
    }
}

function salvarConfiguracoes() {
    const configs = {
        whatsapp: document.getElementById('config-whatsapp').value,
        email: document.getElementById('config-email').value,
        horarioSegSex: document.getElementById('config-horario-seg-sex').value,
        horarioSab: document.getElementById('config-horario-sab').value,
        sheetsEndpoint: document.getElementById('config-sheets-endpoint')?.value || ''
    };

    localStorage.setItem('config_donalu', JSON.stringify(configs));
    mostrarNotificacao('Configurações salvas com sucesso! ✅');
    // Opcional: enviar configs para Sheets
    postToSheets('config', configs);
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

function mostrarNotificacao(mensagem) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notif.textContent = mensagem;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ==================== INTEGRAÇÃO COM GOOGLE SHEETS ====================
const SHEETS_DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbydaETxCzGMqg7_RrlCFvojrXEcF_89aSJJz3fJVSq-0rEsZStfdRMVVPT58Rb03kR-/exec';

function getSheetsEndpoint() {
    const configs = JSON.parse(localStorage.getItem('config_donalu')) || {};
    return configs.sheetsEndpoint || SHEETS_DEFAULT_ENDPOINT || '';
}

async function postToSheets(action, data) {
    try {
        const url = getSheetsEndpoint();
        if (!url) return; // sem endpoint configurado

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data })
        });
        if (!resp.ok) console.warn('Falha ao enviar para Google Sheets:', resp.status);
    } catch (e) {
        console.warn('Erro ao enviar para Google Sheets:', e);
    }
}

// ========== BUSCA DE PRODUTO ==========
function buscarProduto() {
    const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
    const select = document.getElementById('venda-produto-select');
    const options = select.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const texto = option.textContent.toLowerCase();
        
        if (texto.includes(termoBusca) || termoBusca === '') {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    }
}

// ========== EDITAR ITEM DA VENDA ==========
function editarItemVenda(index) {
    const itens = JSON.parse(sessionStorage.getItem('itens_venda_temp')) || [];
    const item = itens[index];
    
    if (!item) {
        alert('Item não encontrado!');
        return;
    }

    // Preencher o formulário com os dados do item
    document.getElementById('venda-produto-select').value = item.produtoId;
    document.getElementById('venda-quantidade').value = item.quantidade;
    document.getElementById('venda-preco-item').value = item.precoUnitario;

    // Remover o item da lista temporária
    removerItemVenda(index);

    // Rolar até o formulário
    document.getElementById('form-venda-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Focar no campo de quantidade
    setTimeout(() => {
        document.getElementById('venda-quantidade').focus();
        document.getElementById('venda-quantidade').select();
    }, 300);

    mostrarNotificacao('Item carregado para edição ✏️');
}
