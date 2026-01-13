// ==================== CONFIGURAÇÕES ====================
const WHATSAPP_NUMERO = '+55 51 99583-7023';
const ADMIN_EMAIL = 'admin@donalu.com';
const ADMIN_SENHA = 'admin123';

// ==================== VARIÁVEIS GLOBAIS ====================
let produtos = [];
let carrinho = [];
let usuarioLogado = false;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    atualizarCarrinho();
    verificarLoginLocal();
});

// ==================== FUNÇÕES DE PRODUTOS ====================

// Carregar produtos (simulado - depois será via Google Sheets)
function carregarProdutos() {
    // Produtos fictícios para demonstração
    produtos = [
        {
            id: 1,
            nome: 'Algodão Premium',
            descricao: 'Tecido 100% algodão, perfeito para roupas confortáveis',
            preco: 45.90,
            categoria: 'algodao',
            imagem: '🧵'
        },
        {
            id: 2,
            nome: 'Linho Natural',
            descricao: 'Linho importado, ideal para peças sofisticadas',
            preco: 89.90,
            categoria: 'linho',
            imagem: '🌾'
        },
        {
            id: 3,
            nome: 'Poliéster Brilhante',
            descricao: 'Poliéster com acabamento brilhante, resistente',
            preco: 32.50,
            categoria: 'poliester',
            imagem: '✨'
        },
        {
            id: 4,
            nome: 'Seda Pura',
            descricao: 'Seda natural de alta qualidade',
            preco: 150.00,
            categoria: 'seda',
            imagem: '💎'
        },
        {
            id: 5,
            nome: 'Misto Conforto',
            descricao: 'Mistura de algodão e poliéster, melhor custo-benefício',
            preco: 55.00,
            categoria: 'misto',
            imagem: '👚'
        },
        {
            id: 6,
            nome: 'Algodão Orgânico',
            descricao: 'Algodão 100% orgânico, sustentável e macio',
            preco: 65.00,
            categoria: 'algodao',
            imagem: '🌱'
        }
    ];

    // Guardar no localStorage para simular persistência
    if (!localStorage.getItem('produtos_donalu')) {
        localStorage.setItem('produtos_donalu', JSON.stringify(produtos));
    } else {
        produtos = JSON.parse(localStorage.getItem('produtos_donalu'));
    }

    exibirProdutos(produtos);
}

// Exibir produtos na tela
function exibirProdutos(listaProdutos) {
    const gridProdutos = document.getElementById('grid-produtos');
    
    if (listaProdutos.length === 0) {
        gridProdutos.innerHTML = '<div class="sem-resultados">Nenhum produto encontrado 😢</div>';
        return;
    }

    let html = '';
    listaProdutos.forEach(produto => {
        const temImagem = produto.imagem && (String(produto.imagem).startsWith('data:image') || String(produto.imagem).startsWith('http'));
        const imagemHtml = temImagem
            ? `<img src="${produto.imagem}" alt="${produto.nome}">`
            : `${produto.imagem || '📦'}`;

        html += `
        <div class="card-produto">
            <div class="produto-imagem">${imagemHtml}</div>
            <div class="produto-info">
                <div class="produto-categoria">${produto.categoria}</div>
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-desc">${produto.descricao}</div>
                <div class="produto-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
                <button class="btn-add-carrinho" onclick="adicionarAoCarrinho(${produto.id})">
                    🛒 Adicionar ao Carrinho
                </button>
            </div>
        </div>`;
    });

    gridProdutos.innerHTML = html;
}

// Filtrar produtos por busca e categoria
function filtrarProdutos() {
    const busca = document.getElementById('busca').value.toLowerCase();
    const categoria = document.getElementById('categoria').value;

    const produtosFiltrados = produtos.filter(produto => {
        const matchBusca = produto.nome.toLowerCase().includes(busca) || 
                          produto.descricao.toLowerCase().includes(busca);
        const matchCategoria = categoria === '' || produto.categoria === categoria;
        return matchBusca && matchCategoria;
    });

    exibirProdutos(produtosFiltrados);
}

// ==================== FUNÇÕES DE CARRINHO ====================

function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    const itemCarrinho = carrinho.find(item => item.id === produtoId);

    if (itemCarrinho) {
        itemCarrinho.quantidade = parseFloat((itemCarrinho.quantidade + 0.1).toFixed(2));
    } else {
        carrinho.push({
            ...produto,
            quantidade: 1
        });
    }

    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho! ✅`);
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarCarrinho();
}

function atualizarQuantidadeCarrinho(produtoId, quantidade) {
    const item = carrinho.find(p => p.id === produtoId);
    if (item) {
        const novaQtd = parseFloat(quantidade);
        item.quantidade = Math.max(0.1, parseFloat(novaQtd.toFixed(2)));
        atualizarCarrinho();
    }
}

function atualizarCarrinho() {
    const qtdCarrinho = document.getElementById('qtd-carrinho');
    const totalQtd = carrinho.reduce((total, item) => total + item.quantidade, 0);
    qtdCarrinho.textContent = totalQtd;

    // Salvar no localStorage
    localStorage.setItem('carrinho_donalu', JSON.stringify(carrinho));

    // Atualizar display do carrinho
    const itensCarrinho = document.getElementById('itens-carrinho');
    if (itensCarrinho) {
        if (carrinho.length === 0) {
            itensCarrinho.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Carrinho vazio 🛒</p>';
        } else {
            itensCarrinho.innerHTML = carrinho.map(item => `
                <div class="item-carrinho">
                    <div class="item-carrinho-info">
                        <div class="item-carrinho-nome">${item.nome}</div>
                        <div class="item-carrinho-preco">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div class="item-carrinho-controls">
                        <div class="item-carrinho-qtd">
                            <button onclick="atualizarQuantidadeCarrinho(${item.id}, ${parseFloat((item.quantidade - 0.1).toFixed(2))})">−</button>
                            <span>${item.quantidade.toFixed(2)}</span>
                            <button onclick="atualizarQuantidadeCarrinho(${item.id}, ${parseFloat((item.quantidade + 0.1).toFixed(2))})">+</button>
                        </div>
                        <button class="item-carrinho-remover" onclick="removerDoCarrinho(${item.id})">Remover</button>
                    </div>
                </div>
            `).join('');
        }

        // Atualizar total
        const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        document.getElementById('total-carrinho').textContent = total.toFixed(2).replace('.', ',');
    }
}

function finalizarCompra() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // Preparar mensagem para WhatsApp
    let mensagem = '🛍️ *PEDIDO DONALÚ TECIDOS* 🛍️\n\n';
    mensagem += 'Olá! Gostaria de fazer um pedido com os seguintes itens:\n\n';

    let total = 0;
    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        mensagem += `${index + 1}. ${item.nome}\n`;
        mensagem += `   Quantidade: ${item.quantidade}\n`;
        mensagem += `   Preço unitário: R$ ${item.preco.toFixed(2).replace('.', ',')}\n`;
        mensagem += `   Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n\n`;
    });

    mensagem += `💰 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
    mensagem += 'Por favor, confirme a disponibilidade e envie mais informações de entrega.';

    // Enviar para WhatsApp
    abrirWhatsapp(mensagem);

    // Limpar carrinho após compra
    carrinho = [];
    atualizarCarrinho();
    fecharCarrinho();
    mostrarNotificacao('Pedido enviado para WhatsApp! 🎉');
}

function abrirCarrinho() {
    document.getElementById('sidebar-carrinho').classList.add('active');
    document.getElementById('overlay-carrinho').classList.add('active');
}

function fecharCarrinho() {
    document.getElementById('sidebar-carrinho').classList.remove('active');
    document.getElementById('overlay-carrinho').classList.remove('active');
}

// ==================== FUNÇÕES DE MODAIS ====================

function abrirLogin() {
    document.getElementById('modal-login').classList.add('active');
}

function fecharLogin() {
    document.getElementById('modal-login').classList.remove('active');
}

// Fechar modal clicando fora
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-login') {
        fecharLogin();
    }
});

// ==================== FUNÇÕES DE LOGIN ====================

function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    // Validação simples
    if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
        usuarioLogado = true;
        localStorage.setItem('admin_logado', 'true');
        fecharLogin();
        document.getElementById('email').value = '';
        document.getElementById('senha').value = '';
        mostrarNotificacao('Login realizado com sucesso! ✅');
        
        // Redirecionar para página de admin
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 500);
    } else {
        alert('Email ou senha incorretos!');
    }
}

function verificarLoginLocal() {
    if (localStorage.getItem('admin_logado') === 'true') {
        usuarioLogado = true;
    }
}

// ==================== FUNÇÕES DE WHATSAPP ====================

function abrirWhatsapp(mensagem = 'oi') {
    const numeroFormatado = WHATSAPP_NUMERO.replace(/\D/g, '');
    const mensagemCodificada = encodeURIComponent(mensagem);
    const url = `https://wa.me/${numeroFormatado}?text=${mensagemCodificada}`;
    window.open(url, '_blank');
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

function mostrarNotificacao(mensagem) {
    // Criar elemento de notificação
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
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

    // Remover após 3 segundos
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Carregar carrinho do localStorage ao iniciar
window.addEventListener('load', () => {
    const carrinhoSalvo = localStorage.getItem('carrinho_donalu');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
        atualizarCarrinho();
    }
});

