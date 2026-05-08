document.addEventListener('DOMContentLoaded', () => {
    let carrinho = [];

    // --- 1. NAVEGAÇÃO E FILTROS ---
    window.scrollMenu = function(direcao) {
        const c = document.getElementById('menuCarrossel');
        const largura = c.firstElementChild.offsetWidth + 15;
        c.scrollBy({ left: direcao * largura, behavior: 'smooth' });
    };

    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.onclick = () => {
            const target = btn.getAttribute('data-target');
            document.querySelectorAll('.categoria-vitrine').forEach(v => v.classList.remove('visivel'));
            document.getElementById(target).classList.add('visivel');
            window.scrollTo({ top: document.getElementById(target).offsetTop - 20, behavior: 'smooth' });
        };
    });

    // --- 2. CONTROLE DE QTD NO CARD ---
    window.alterarQtdCard = (id, delta) => {
        const span = document.getElementById(`qtd-${id}`);
        let atual = parseInt(span.innerText);
        atual = Math.max(1, atual + delta);
        span.innerText = atual;
    };

    // --- 3. LÓGICA DO CARRINHO ---
    window.adicionarAoCarrinho = (nome, preco, id) => {
        const qtd = parseInt(document.getElementById(`qtd-${id}`).innerText);
        const itemExistente = carrinho.find(i => i.nome === nome);
        
        if (itemExistente) {
            itemExistente.quantidade += qtd;
        } else {
            carrinho.push({ nome, preco: parseFloat(preco), quantidade: qtd });
        }
        
        // Resetar a quantidade no card após adicionar
        document.getElementById(`qtd-${id}`).innerText = "1";
        
        atualizarInterface();
    };

    window.removerItemCarrinho = (index) => {
        carrinho.splice(index, 1);
        atualizarInterface();
        if (carrinho.length === 0) fecharCarrinho();
    };

    function atualizarInterface() {
        const lista = document.getElementById('itens-carrinho-lista');
        const totalSpan = document.getElementById('carrinho-valor-total');
        const contador = document.getElementById('contador-carrinho');
        const btnFlut = document.getElementById('btn-flutuante-carrinho');

        lista.innerHTML = '';
        let total = 0;
        carrinho.forEach((item, index) => {
            total += item.preco * item.quantidade;
            lista.innerHTML += `
                <div class="item-carrinho">
                    <div>
                        <strong>${item.quantidade}x ${item.nome}</strong><br>
                        <small>R$ ${(item.preco * item.quantidade).toFixed(2)}</small>
                    </div>
                    <button onclick="removerItemCarrinho(${index})" style="border:none; background:none; font-size:1.2rem; cursor:pointer;">🗑️</button>
                </div>`;
        });

        totalSpan.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
        contador.innerText = carrinho.reduce((acc, i) => acc + i.quantidade, 0);
        btnFlut.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }

    window.abrirCarrinho = () => document.getElementById('modal-carrinho').style.display = 'flex';
    window.fecharCarrinho = () => document.getElementById('modal-carrinho').style.display = 'none';

    window.enviarCarrinhoWhatsApp = () => {
        const nome = document.getElementById('nome-cliente-carrinho').value;
        if (!nome) return alert("Por favor, digite seu nome.");
        
        let msg = `*Pedido - Delícias da Tia Rose*\\n👤 Cliente: ${nome}\\n\\n`;
        let total = 0;
        carrinho.forEach(i => {
            msg += `• ${i.quantidade}x ${i.nome} - R$ ${(i.preco * i.quantidade).toFixed(2)}\\n`;
            total += i.preco * i.quantidade;
        });
        msg += `\\n💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
        
        window.location.href = `https://wa.me/5516991839509?text=${encodeURIComponent(msg)}`;
    };

    // --- 4. FIREBASE (BANNER E PRODUTOS) ---
    setTimeout(() => {
        if (!window.dbMetodos) return;
        const { doc, getDoc, onSnapshot, collection, query, orderBy } = window.dbMetodos;

        getDoc(doc(window.db, "configuracoes", "banner")).then(d => {
            if (d.exists() && d.data().visivel) {
                document.getElementById('texto-aviso').innerText = d.data().texto;
                document.getElementById('banner-aviso').style.display = 'flex';
            }
        });

        const categoriasMap = {
            'PROMOCAO': 'listaPromocoes',
            'DOCES': 'listaDoces',
            'BALAS DE COCO': 'listaBalas',
            'OVOS DE PASCOA': 'listaOvos',
            'BOLOS': 'listaBolos',
            'SALGADOS': 'listaSalgados'
        };

        onSnapshot(query(collection(window.db, "produtos_v2"), orderBy("dataCriacao", "desc")), (snap) => {
            Object.values(categoriasMap).forEach(id => document.getElementById(id).innerHTML = '');
            
            snap.forEach(d => {
                const p = d.data();
                const containerId = categoriasMap[p.categoria];
                if (containerId) {
                    const idProd = d.id;
                    document.getElementById(containerId).innerHTML += `
                        <div class="card">
                            <img src="${p.urlImagem}">
                            <div style="padding:10px">
                                <h4 style="font-size:0.9rem">${p.nome}</h4>
                                <p style="color:var(--rosa-principal); font-weight:bold; margin:5px 0">R$ ${parseFloat(p.preco).toFixed(2)}</p>
                                
                                <div class="card-controles">
                                    <button class="btn-qtd-card" onclick="alterarQtdCard('${idProd}', -1)">-</button>
                                    <span class="qtd-numero" id="qtd-${idProd}">1</span>
                                    <button class="btn-qtd-card" onclick="alterarQtdCard('${idProd}', 1)">+</button>
                                </div>

                                <button class="btn-whats" onclick="adicionarAoCarrinho('${p.nome}', '${p.preco}', '${idProd}')">🛒 Adicionar</button>
                            </div>
                        </div>`;
                }
            });
            document.getElementById('secao-promocoes').classList.add('visivel');
        });
    }, 1200);
});