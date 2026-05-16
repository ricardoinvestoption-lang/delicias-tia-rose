// =============================================
// SCRIPT PRINCIPAL - Delícias da Tia Rose (V2)
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // 1. CARRINHO DE COMPRAS
    // =============================================
    let carrinho = [];

    function atualizarContador() {
        const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        const contador = document.getElementById('carrinho-contador');
        const btn = document.getElementById('btn-carrinho-flutuante');
        if (contador) contador.textContent = total;
        if (btn) btn.style.display = total > 0 ? 'flex' : 'none';
    }

    function calcularTotal() {
        return carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    }

    function formatarMoeda(valor) {
        return 'R$ ' + valor.toFixed(2).replace('.', ',');
    }

    function renderizarCarrinho() {
        const lista = document.getElementById('carrinho-lista');
        const vazio = document.getElementById('carrinho-vazio');
        const footer = document.getElementById('modal-carrinho-footer');

        if (!lista) return;
        lista.innerHTML = '';

        if (carrinho.length === 0) {
            if (vazio) vazio.style.display = 'block';
            if (footer) footer.style.display = 'none';
            return;
        }

        if (vazio) vazio.style.display = 'none';
        if (footer) footer.style.display = 'block';

        carrinho.forEach((item, index) => {
            const subtotal = item.preco * item.quantidade;
            const div = document.createElement('div');
            div.className = 'carrinho-item';
            div.innerHTML = `
                <div class="carrinho-item-info">
                    <span class="carrinho-item-nome">${escapeHtml(item.nome)}</span>
                    <span class="carrinho-item-unitario">
                        ${formatarMoeda(item.preco)} × ${item.quantidade} = 
                        <strong>${formatarMoeda(subtotal)}</strong>
                    </span>
                </div>
                <div class="carrinho-item-controles">
                    <button class="btn-qtd" data-index="${index}" data-delta="-1">−</button>
                    <span class="carrinho-item-qtd">${item.quantidade}</span>
                    <button class="btn-qtd" data-index="${index}" data-delta="1">+</button>
                    <button class="btn-remover-item" data-index="${index}" title="Remover">🗑️</button>
                </div>
            `;
            lista.appendChild(div);
        });

        // Event delegation para os botões
        lista.querySelectorAll('.btn-qtd').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                const delta = parseInt(btn.dataset.delta);
                alterarQuantidade(index, delta);
            });
        });
        lista.querySelectorAll('.btn-remover-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                removerItem(index);
            });
        });

        const totalDiv = document.createElement('div');
        totalDiv.className = 'carrinho-resumo';
        totalDiv.innerHTML = `
            <span>${carrinho.length} ${carrinho.length === 1 ? 'item' : 'itens'} no carrinho</span>
            <span class="carrinho-total-destaque">${formatarMoeda(calcularTotal())}</span>
        `;
        lista.appendChild(totalDiv);

        const totalValor = document.getElementById('carrinho-total-valor');
        if (totalValor) totalValor.textContent = formatarMoeda(calcularTotal());
    }

    function alterarQuantidade(index, delta) {
        if (!carrinho[index]) return;
        carrinho[index].quantidade += delta;
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
        atualizarContador();
        renderizarCarrinho();
    }

    function removerItem(index) {
        carrinho.splice(index, 1);
        atualizarContador();
        renderizarCarrinho();
    }

    window.adicionarAoCarrinho = function(nome, preco) {
        const existente = carrinho.find(i => i.nome === nome);
        if (existente) {
            existente.quantidade++;
        } else {
            carrinho.push({ nome, preco: parseFloat(preco), quantidade: 1 });
        }
        atualizarContador();

        document.querySelectorAll('.btn-adicionar-carrinho').forEach(btn => {
            if (btn.getAttribute('data-nome') === nome) {
                const textoOriginal = btn.textContent;
                btn.textContent = '✅ Adicionado!';
                btn.classList.add('btn-adicionado');
                setTimeout(() => {
                    btn.textContent = textoOriginal;
                    btn.classList.remove('btn-adicionado');
                }, 1300);
            }
        });
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =============================================
    // 2. MODAIS
    // =============================================
    function abrirCarrinho() {
        renderizarCarrinho();
        const modal = document.getElementById('modal-carrinho');
        if (modal) modal.style.display = 'flex';
    }

    function fecharCarrinho() {
        const modal = document.getElementById('modal-carrinho');
        if (modal) modal.style.display = 'none';
    }

    function abrirModalNome() {
        if (carrinho.length === 0) return;
        fecharCarrinho();
        const input = document.getElementById('modal-input-nome');
        if (input) {
            input.value = '';
            input.style.border = '1.5px solid #ddd';
        }
        const modal = document.getElementById('modal-pedido');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => input && input.focus(), 100);
        }
    }

    function fecharModalPedido() {
        const modal = document.getElementById('modal-pedido');
        if (modal) modal.style.display = 'none';
    }

    async function confirmarPedido() {
        const nomeCliente = document.getElementById('modal-input-nome')?.value.trim();
        if (!nomeCliente) {
            const input = document.getElementById('modal-input-nome');
            if (input) input.style.border = '2px solid #e91e63';
            return;
        }

        const linhas = carrinho.map(item =>
            `• ${item.quantidade}x ${item.nome} — ${formatarMoeda(item.preco * item.quantidade)}`
        );
        const total = calcularTotal();
        const mensagem = `Olá Rose! Eu sou *${nomeCliente}* e gostaria de fazer o seguinte pedido:\n\n${linhas.join('\n')}\n\n*Total: ${formatarMoeda(total)}*`;

        const fone = "5516991839509";
        window.location.href = `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;

        fecharModalPedido();

        // Salvar no Firestore se disponível
        if (window.db && window.dbMetodos) {
            const { collection, addDoc, serverTimestamp } = window.dbMetodos;
            const dataHora = serverTimestamp();
            for (const item of carrinho) {
                try {
                    await addDoc(collection(window.db, "pedidos"), {
                        cliente: nomeCliente,
                        produto: `${item.quantidade}x ${item.nome}`,
                        valor: (item.preco * item.quantidade).toFixed(2),
                        status: "novo",
                        data: dataHora
                    });
                } catch (e) {
                    console.error("Erro ao salvar pedido:", e);
                }
            }
        }

        carrinho = [];
        atualizarContador();
    }

    // =============================================
    // 3. CARROSSEL
    // =============================================
    function scrollMenu(direcao) {
        const carrossel = document.getElementById('menuCarrossel');
        if (carrossel && carrossel.firstElementChild) {
            const larguraCard = carrossel.firstElementChild.offsetWidth + 12;
            carrossel.scrollBy({ left: direcao * larguraCard, behavior: 'smooth' });
        }
    }

    function inicializarIndicadores() {
        const carrossel = document.getElementById('menuCarrossel');
        const container = document.getElementById('indicadoresCarrossel');
        if (!carrossel || !container) return;

        const cards = carrossel.querySelectorAll('.card-categoria');
        container.innerHTML = '';
        cards.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'indicador' + (i === 0 ? ' ativo' : '');
            container.appendChild(dot);
        });

        carrossel.addEventListener('scroll', () => {
            const cardsAtuais = carrossel.querySelectorAll('.card-categoria');
            if (cardsAtuais.length === 0) return;
            const larguraCard = cardsAtuais[0].offsetWidth + 12;
            const index = Math.round(carrossel.scrollLeft / larguraCard);
            container.querySelectorAll('.indicador').forEach((dot, i) => {
                dot.classList.toggle('ativo', i === index);
            });
        });
    }

    // =============================================
    // 4. MODAL DE SENHA ADMIN
    // =============================================
    let adminSection = null;
    const SENHA_CORRETA = "5060";

    function criarModalSenha() {
        // Remove se já existir
        const existing = document.getElementById('modal-senha-admin');
        if (existing) existing.remove();

        const modalSenha = document.createElement('div');
        modalSenha.id = 'modal-senha-admin';
        modalSenha.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.55);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        `;
        modalSenha.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 32px 28px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                max-width: 300px;
                width: 90%;
            ">
                <div style="font-size: 2rem; margin-bottom: 8px;">🔒</div>
                <h3 style="margin: 0 0 6px; color: #6d4c41; font-size: 1.1rem;">Área Administrativa</h3>
                <p style="margin: 0 0 18px; color: #888; font-size: 0.88rem;">Digite a senha de 4 dígitos</p>
                <input
                    id="input-senha-admin"
                    type="password"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="• • • •"
                    style="
                        width: 100%;
                        padding: 12px;
                        font-size: 1.6rem;
                        letter-spacing: 0.5rem;
                        text-align: center;
                        border: 2px solid #ddd;
                        border-radius: 10px;
                        outline: none;
                        box-sizing: border-box;
                        margin-bottom: 6px;
                    "
                />
                <p id="msg-senha-errada" style="color: #e91e63; font-size: 0.85rem; min-height: 20px; margin: 4px 0 14px;"></p>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-cancelar-senha" style="
                        flex: 1; padding: 11px; border: 1.5px solid #ddd;
                        border-radius: 10px; background: white; color: #888;
                        font-size: 0.95rem; cursor: pointer;
                    ">Cancelar</button>
                    <button id="btn-confirmar-senha" style="
                        flex: 1; padding: 11px; border: none;
                        border-radius: 10px; background: #6d4c41; color: white;
                        font-size: 0.95rem; font-weight: bold; cursor: pointer;
                    ">Entrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalSenha);
        return modalSenha;
    }

    let cliquesAdmin = 0;

    function abrirModalSenha() {
        let modal = document.getElementById('modal-senha-admin');
        if (!modal) modal = criarModalSenha();
        
        const input = document.getElementById('input-senha-admin');
        const msg = document.getElementById('msg-senha-errada');
        if (input) input.value = '';
        if (msg) msg.textContent = '';
        if (input) input.style.border = '2px solid #ddd';
        modal.style.display = 'flex';
        setTimeout(() => input && input.focus(), 150);
    }

    function fecharModalSenha() {
        const modal = document.getElementById('modal-senha-admin');
        if (modal) modal.style.display = 'none';
        cliquesAdmin = 0;
    }

    function verificarSenha() {
        const input = document.getElementById('input-senha-admin');
        const msg = document.getElementById('msg-senha-errada');
        if (input && input.value === SENHA_CORRETA) {
            fecharModalSenha();
            if (adminSection) adminSection.style.display = 'block';
        } else {
            if (input) input.style.border = '2px solid #e91e63';
            if (msg) msg.textContent = '❌ Senha incorreta. Tente novamente.';
            if (input) input.value = '';
            setTimeout(() => input && input.focus(), 100);
        }
    }

    // =============================================
    // 5. FIREBASE E VITRINE
    // =============================================
    function aguardarFirebase() {
        return new Promise((resolve) => {
            if (window.db && window.dbMetodos) {
                resolve();
            } else {
                window.addEventListener('firebase-ready', resolve, { once: true });
            }
        });
    }

    async function inicializarFirebase() {
        await aguardarFirebase();
        
        if (!window.dbMetodos) {
            console.error("Firebase não disponível");
            return;
        }

        const { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, getDoc, updateDoc, serverTimestamp } = window.dbMetodos;
        const db = window.db;
        const produtosRef = collection(db, "produtos_v2");

        let produtosIdsSemana = [];

        // ========== BANNER ==========
        async function carregarBanner() {
            try {
                const bannerDoc = await getDoc(doc(db, "configuracoes", "banner"));
                if (bannerDoc.exists()) {
                    const dados = bannerDoc.data();
                    const spanAviso = document.getElementById('texto-aviso');
                    const inputBanner = document.getElementById('textoBanner');
                    const bannerDiv = document.getElementById('banner-aviso');
                    if (spanAviso && dados.texto) spanAviso.textContent = dados.texto;
                    if (inputBanner && dados.texto) inputBanner.value = dados.texto;
                    if (bannerDiv) bannerDiv.style.display = dados.visivel === false ? 'none' : 'flex';
                }
            } catch (e) {
                console.error("Erro ao carregar banner:", e);
            }
        }

        window.salvarBanner = async function() {
            const texto = document.getElementById('textoBanner')?.value.trim();
            if (!texto) {
                alert("Digite uma mensagem para o banner!");
                return;
            }
            try {
                await setDoc(doc(db, "configuracoes", "banner"), { texto, visivel: true });
                const spanAviso = document.getElementById('texto-aviso');
                if (spanAviso) spanAviso.textContent = texto;
                const bannerDiv = document.getElementById('banner-aviso');
                if (bannerDiv) bannerDiv.style.display = 'flex';
                alert("✅ Banner atualizado com sucesso!");
            } catch (e) {
                alert("Erro ao salvar banner.");
            }
        };

        // ========== PRODUTOS DA SEMANA ==========
        async function carregarProdutosSemana() {
            try {
                const semanaDoc = await getDoc(doc(db, "configuracoes", "produtos_semana"));
                if (semanaDoc.exists()) {
                    produtosIdsSemana = semanaDoc.data().produtosIds || [];
                }
            } catch (e) {
                console.error("Erro ao carregar produtos da semana:", e);
            }
        }

        window.salvarProdutosSemana = async function() {
            const idsSelecionados = [];
            document.querySelectorAll('.checkbox-produto-semana:checked').forEach(cb => {
                idsSelecionados.push(cb.value);
            });
            
            if (idsSelecionados.length === 0) {
                alert("Selecione pelo menos um produto para aparecer em 'Nesta Semana'");
                return;
            }
            
            try {
                await setDoc(doc(db, "configuracoes", "produtos_semana"), {
                    produtosIds: idsSelecionados,
                    atualizadoEm: new Date()
                });
                produtosIdsSemana = idsSelecionados;
                const statusSpan = document.getElementById('statusSemana');
                if (statusSpan) {
                    statusSpan.innerHTML = '✅ Salvo!';
                    setTimeout(() => { if (statusSpan) statusSpan.innerHTML = ''; }, 2000);
                }
                inicializarVitrine();
            } catch (e) {
                alert("Erro ao salvar seleção.");
            }
        };

        // ========== LISTA DE PRODUTOS PARA ADMIN ==========
        function carregarListaProdutosAdmin() {
            const container = document.getElementById('lista-produtos-para-semana');
            if (!container) return;
            
            const q = query(produtosRef, orderBy("dataCriacao", "desc"));
            
            onSnapshot(q, (snapshot) => {
                if (snapshot.error) {
                    console.error("Erro ao carregar produtos:", snapshot.error);
                    container.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar produtos. Tente recarregar a página.</p>';
                    return;
                }
                container.innerHTML = '';
                if (snapshot.empty) {
                    container.innerHTML = '<p style="color:#aaa; text-align:center;">Nenhum produto cadastrado ainda.</p>';
                    return;
                }
                
                const porCategoria = {};
                snapshot.forEach(docSnap => {
                    const p = docSnap.data();
                    const cat = p.categoria || 'OUTROS';
                    if (!porCategoria[cat]) porCategoria[cat] = [];
                    porCategoria[cat].push({ id: docSnap.id, ...p });
                });
                
                for (const [categoria, produtos] of Object.entries(porCategoria)) {
                    const catDiv = document.createElement('div');
                    catDiv.style.marginBottom = '15px';
                    catDiv.style.borderBottom = '1px solid #eee';
                    catDiv.style.paddingBottom = '10px';
                    
                    const tituloCat = document.createElement('h4');
                    tituloCat.style.margin = '0 0 8px 0';
                    tituloCat.style.color = '#6d4c41';
                    tituloCat.textContent = `📁 ${categoria}`;
                    catDiv.appendChild(tituloCat);
                    
                    produtos.forEach(p => {
                        const precoFormatado = parseFloat(p.preco).toFixed(2).replace('.', ',');
                        const label = document.createElement('label');
                        label.className = 'checkbox-produto-item';
                        label.innerHTML = `
                            <input type="checkbox" class="checkbox-produto-semana" value="${p.id}" ${produtosIdsSemana.includes(p.id) ? 'checked' : ''}>
                            <img src="${p.urlImagem}" onerror="this.src='https://via.placeholder.com/40'">
                            <div class="info">
                                <div class="nome">${escapeHtml(p.nome)}</div>
                                <div class="preco">R$ ${precoFormatado}</div>
                            </div>
                        `;
                        catDiv.appendChild(label);
                    });
                    container.appendChild(catDiv);
                }
            });
        }

        // ========== VITRINE PRINCIPAL ==========
        window.excluirProduto = async (id) => {
            if (confirm("Deseja remover este produto da nuvem?")) {
                await deleteDoc(doc(db, "produtos_v2", id));
            }
        };

        function inicializarVitrine() {
            const listas = {
                'PROMOCAO': 'listaPromocoes',
                'SALGADOS': 'listaSalgados',
                'BOLOS': 'listaBolos',
                'DOCES': 'listaDoces',
                'BALAS DE COCO': 'listaBalas',
                'OVOS DE PASCOA': 'listaOvos'
            };

            const q = query(produtosRef, orderBy("dataCriacao", "desc"));

            onSnapshot(q, (snapshot) => {
                Object.values(listas).forEach(id => {
                    const div = document.getElementById(id);
                    if (div) div.innerHTML = '';
                });

                const produtosPorCategoria = {};
                const produtosPorId = {};
                
                snapshot.forEach((docSnap) => {
                    const p = docSnap.data();
                    const id = docSnap.id;
                    const cat = p.categoria;
                    if (!produtosPorCategoria[cat]) produtosPorCategoria[cat] = [];
                    produtosPorCategoria[cat].push({ id, ...p });
                    produtosPorId[id] = { id, ...p };
                });

                const estaNoModoAdmin = adminSection && adminSection.style.display === 'block';

                for (const [categoria, listaId] of Object.entries(listas)) {
                    const produtos = produtosPorCategoria[categoria] || [];
                    const container = document.getElementById(listaId);
                    if (!container) continue;
                    
                    produtos.forEach(p => {
                        const precoFormatado = parseFloat(p.preco).toFixed(2).replace('.', ',');
                        const nomeSeguro = escapeHtml(p.nome);
                        const btnExcluir = estaNoModoAdmin
                            ? `<button class="btn-remover" onclick="window.excluirProduto('${p.id}')" style="position:absolute;top:5px;right:5px;background:red;color:white;border:none;border-radius:50%;width:25px;height:25px;cursor:pointer;z-index:10;font-weight:bold;">×</button>`
                            : '';
                        const badgePromocao = p.categoria === 'PROMOCAO'
                            ? `<div style="background:#6d4c41;color:white;font-size:0.75rem;font-weight:bold;padding:4px 10px;text-align:center;">🔥 PROMOÇÃO</div>`
                            : '';

                        const card = document.createElement('div');
                        card.className = 'card';
                        card.style.position = 'relative';
                        card.innerHTML = `
                            ${btnExcluir}
                            ${badgePromocao}
                            <img src="${p.urlImagem}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+nao+encontrada'">
                            <div class="card-content">
                                <h3 class="card-name">${escapeHtml(p.nome)}</h3>
                                <p class="card-price">R$ ${precoFormatado}</p>
                                <button
                                    class="btn-whats btn-adicionar-carrinho"
                                    data-nome="${p.nome}"
                                    onclick="adicionarAoCarrinho('${nomeSeguro.replace(/'/g, "\\'")}', '${p.preco}')">
                                    🛒 Adicionar
                                </button>
                            </div>
                        `;
                        container.appendChild(card);
                    });
                }

                // Seção "Nesta Semana"
                const secaoSemana = document.getElementById('secao-promocoes');
                const containerSemana = document.getElementById('listaPromocoes');
                
                if (secaoSemana && containerSemana) {
                    containerSemana.innerHTML = '';
                    
                    const produtosSemana = produtosIdsSemana
                        .map(id => produtosPorId[id])
                        .filter(p => p !== undefined);
                    
                    if (produtosSemana.length === 0) {
                        containerSemana.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum produto selecionado para esta semana. Acesse o modo Admin e escolha os produtos.</p>';
                    } else {
                        produtosSemana.forEach(p => {
                            const precoFormatado = parseFloat(p.preco).toFixed(2).replace('.', ',');
                            const nomeSeguro = escapeHtml(p.nome);
                            const btnExcluir = (adminSection && adminSection.style.display === 'block')
                                ? `<button class="btn-remover" onclick="window.excluirProduto('${p.id}')" style="position:absolute;top:5px;right:5px;background:red;color:white;border:none;border-radius:50%;width:25px;height:25px;cursor:pointer;z-index:10;font-weight:bold;">×</button>`
                                : '';
                            
                            const card = document.createElement('div');
                            card.className = 'card';
                            card.style.position = 'relative';
                            card.innerHTML = `
                                ${btnExcluir}
                                <img src="${p.urlImagem}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+imagem'">
                                <div class="card-content">
                                    <h3 class="card-name">${escapeHtml(p.nome)}</h3>
                                    <p class="card-price">R$ ${precoFormatado}</p>
                                    <button
                                        class="btn-whats btn-adicionar-carrinho"
                                        data-nome="${p.nome}"
                                        onclick="adicionarAoCarrinho('${nomeSeguro.replace(/'/g, "\\'")}', '${p.preco}')">
                                        🛒 Adicionar
                                    </button>
                                </div>
                            `;
                            containerSemana.appendChild(card);
                        });
                    }
                    secaoSemana.style.display = 'block';
                    secaoSemana.classList.add('visivel');
                }
            });
        }

        // ========== FORMULÁRIO DE CADASTRO ==========
        const doceForm = document.getElementById('doceForm');
        if (doceForm) {
            doceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btnSubmit = doceForm.querySelector('button[type="submit"]');
                const textoOriginal = btnSubmit?.textContent || "Salvar na Nuvem";
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerText = "Salvando...";
                }
                try {
                    await addDoc(produtosRef, {
                        nome: document.getElementById('nome').value,
                        preco: document.getElementById('preco').value,
                        urlImagem: document.getElementById('urlImagem').value,
                        categoria: document.getElementById('categoria').value,
                        dataCriacao: new Date()
                    });
                    doceForm.reset();
                    alert("Produto salvo com sucesso!");
                } catch (err) {
                    alert("Erro ao salvar. Verifique a conexão.");
                } finally {
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerText = textoOriginal;
                    }
                }
            });
        }

        // ========== PEDIDOS ==========
        window.marcarComoEntregue = async (id) => {
            await updateDoc(doc(db, "pedidos", id), { status: "concluído" });
        };

        window.excluirPedido = async (id) => {
            if (confirm("Excluir este registro de pedido?")) {
                await deleteDoc(doc(db, "pedidos", id));
            }
        };

        function monitorarPedidos() {
            const q = query(collection(db, "pedidos"), orderBy("data", "desc"));

            onSnapshot(q, (snapshot) => {
                const container = document.getElementById('lista-pedidos-admin');
                if (!container) return;
                container.innerHTML = '';

                if (snapshot.empty) {
                    container.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;">Nenhum pedido ainda.</p>';
                    return;
                }

                const pedidosPorCliente = {};
                let totalGeral = 0;
                let totalPedidos = 0;

                snapshot.forEach((docSnap) => {
                    const pedido = docSnap.data();
                    const cliente = pedido.cliente || 'Desconhecido';
                    if (!pedidosPorCliente[cliente]) {
                        pedidosPorCliente[cliente] = { total: 0, pedidos: [] };
                    }
                    const valor = parseFloat(pedido.valor) || 0;
                    pedidosPorCliente[cliente].total += valor;
                    totalGeral += valor;
                    totalPedidos++;
                    pedidosPorCliente[cliente].pedidos.push({ ...pedido, id: docSnap.id });
                });

                const resumo = document.createElement('div');
                resumo.style.cssText = `
                    background: linear-gradient(135deg, #6d4c41, #5d4037);
                    color: white;
                    border-radius: 12px;
                    padding: 14px 18px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-weight: bold;
                    font-size: 0.95rem;
                    flex-wrap: wrap;
                    gap: 8px;
                `;
                resumo.innerHTML = `
                    <span>📊 ${totalPedidos} pedido(s) · ${Object.keys(pedidosPorCliente).length} cliente(s)</span>
                    <span style="font-size:1.1rem; background:rgba(255,255,255,0.2); padding:4px 14px; border-radius:20px;">
                        💰 Total Geral: R$ ${totalGeral.toFixed(2).replace('.', ',')}
                    </span>
                `;
                container.appendChild(resumo);

                Object.entries(pedidosPorCliente).forEach(([nomeCliente, dados]) => {
                    const headerCliente = document.createElement('div');
                    headerCliente.style.cssText = `
                        background: linear-gradient(135deg, #f5f1f0, #faf7f2);
                        border: 1.5px solid #6d4c41;
                        border-radius: 10px;
                        padding: 10px 14px;
                        margin-top: 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 6px;
                    `;
                    headerCliente.innerHTML = `
                        <span style="font-weight:bold; color:#6d4c41; font-size:1rem;">👤 ${escapeHtml(nomeCliente)}</span>
                        <span style="background:#6d4c41; color:white; padding:4px 14px; border-radius:20px; font-size:0.9rem; font-weight:bold;">
                            Subtotal: R$ ${dados.total.toFixed(2).replace('.', ',')}
                        </span>
                    `;
                    container.appendChild(headerCliente);

                    dados.pedidos.forEach((pedido) => {
                        const id = pedido.id;
                        const dataFormata = pedido.data
                            ? pedido.data.toDate().toLocaleString('pt-BR')
                            : 'Processando...';
                        const valorFormatado = pedido.valor
                            ? `R$ ${parseFloat(pedido.valor).toFixed(2).replace('.', ',')}`
                            : '—';
                        const isNovo = pedido.status === 'novo';

                        const cardPedido = document.createElement('div');
                        cardPedido.style.cssText = `
                            padding: 10px 14px;
                            border-left: 5px solid ${isNovo ? '#6d4c41' : '#25d366'};
                            background: #f9f9f9;
                            border-radius: 0 8px 8px 0;
                            margin-top: 6px;
                            margin-left: 10px;
                            box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
                        `;
                        cardPedido.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="color:#6d4c41; font-weight:bold;">${escapeHtml(pedido.produto)}</span>
                                    <span style="margin-left:8px; background:#fff3e0; color:#6d4c41; border:1px solid #d4a574; padding:2px 10px; border-radius:20px; font-size:0.85rem; font-weight:bold;">
                                        ${valorFormatado}
                                    </span><br>
                                    <small style="color:#888;">
                                        ${dataFormata} · Status: 
                                        <b style="color:${isNovo ? '#6d4c41' : '#25d366'}">${pedido.status}</b>
                                    </small>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    ${isNovo
                                        ? `<button onclick="window.marcarComoEntregue('${id}')" style="background:#25d366; color:white; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-size:0.85rem;">✅ Concluir</button>`
                                        : ''}
                                    <button onclick="window.excluirPedido('${id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:1.1rem;">🗑️</button>
                                </div>
                            </div>
                        `;
                        container.appendChild(cardPedido);
                    });
                });
            });
        }

        // ========== INICIALIZAÇÃO ==========
        await carregarProdutosSemana();
        carregarBanner();
        inicializarVitrine();
        carregarListaProdutosAdmin();
        monitorarPedidos();

        // Botão de salvar produtos
        const btnSalvar = document.getElementById('btnSalvarProdutosSemana');
        if (btnSalvar) btnSalvar.addEventListener('click', window.salvarProdutosSemana);

        // Botões do banner
        const salvarBannerBtn = document.getElementById('salvarBannerBtn');
        if (salvarBannerBtn) salvarBannerBtn.addEventListener('click', window.salvarBanner);
        
        const ocultarBannerBtn = document.getElementById('ocultarBannerBtn');
        if (ocultarBannerBtn) {
            ocultarBannerBtn.addEventListener('click', () => {
                const banner = document.getElementById('banner-aviso');
                if (banner) banner.style.display = 'none';
            });
        }
        
        const mostrarBannerBtn = document.getElementById('mostrarBannerBtn');
        if (mostrarBannerBtn) {
            mostrarBannerBtn.addEventListener('click', () => {
                const banner = document.getElementById('banner-aviso');
                if (banner) banner.style.display = 'flex';
            });
        }
    }

    // =============================================
    // 6. EVENT LISTENERS
    // =============================================
    
    // Botões do carrossel
    const setaEsq = document.getElementById('seta-esq');
    const setaDir = document.getElementById('seta-dir');
    if (setaEsq) setaEsq.addEventListener('click', () => scrollMenu(-1));
    if (setaDir) setaDir.addEventListener('click', () => scrollMenu(1));

    // Botões "Saiba Mais"
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const elemento = document.getElementById(targetId);
            if (!elemento) return;

            if (targetId === 'secao-promocoes') {
                elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            if (elemento.classList.contains('visivel')) {
                elemento.classList.remove('visivel');
                elemento.style.display = 'none';
            } else {
                elemento.classList.add('visivel');
                elemento.style.display = 'block';
                setTimeout(() => {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });
    });

    // Botões do carrinho
    const btnCarrinho = document.getElementById('btn-carrinho-flutuante');
    if (btnCarrinho) btnCarrinho.addEventListener('click', abrirCarrinho);
    
    const btnFecharCarrinho = document.getElementById('fechar-carrinho');
    if (btnFecharCarrinho) btnFecharCarrinho.addEventListener('click', fecharCarrinho);
    
    const modalCarrinho = document.getElementById('modal-carrinho');
    if (modalCarrinho) {
        modalCarrinho.addEventListener('click', (e) => {
            if (e.target === modalCarrinho) fecharCarrinho();
        });
    }

    // Botões do modal de pedido
    const modalBtnCancelar = document.getElementById('modal-btn-cancelar');
    if (modalBtnCancelar) modalBtnCancelar.addEventListener('click', fecharModalPedido);
    
    const modalBtnConfirmar = document.getElementById('modal-btn-confirmar');
    if (modalBtnConfirmar) modalBtnConfirmar.addEventListener('click', confirmarPedido);
    
    const btnFinalizar = document.getElementById('btn-finalizar-pedido');
    if (btnFinalizar) btnFinalizar.addEventListener('click', abrirModalNome);

    // Botão fechar banner
    const fecharAviso = document.getElementById('fechar-aviso');
    if (fecharAviso) {
        fecharAviso.addEventListener('click', () => {
            const banner = document.getElementById('banner-aviso');
            if (banner) banner.style.display = 'none';
        });
    }

    // Cliques no título para admin
    const titulo = document.getElementById('titulo-principal');
    adminSection = document.getElementById('admin-section');
    
    if (titulo) {
        titulo.addEventListener('click', () => {
            cliquesAdmin++;
            if (cliquesAdmin === 3) {
                abrirModalSenha();
                cliquesAdmin = 0;
            }
        });
    }

    // Configurar modal de senha
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btn-confirmar-senha') verificarSenha();
        if (e.target.id === 'btn-cancelar-senha') fecharModalSenha();
    });
    
    const inputSenha = document.getElementById('input-senha-admin');
    if (inputSenha) {
        inputSenha.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verificarSenha();
        });
    }

    // =============================================
    // 7. GERAR RELATÓRIO DE PEDIDOS
    // =============================================
    window.gerarRelatorio = async function() {
        if (!window.db || !window.dbMetodos) {
            alert('Firebase não está disponível');
            return;
        }

        const { collection, query, orderBy, getDocs } = window.dbMetodos;
        
        try {
            const q = query(collection(window.db, "pedidos"), orderBy("data", "desc"));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                alert('Não há pedidos para gerar relatório.');
                return;
            }

            // Organizar pedidos por cliente
            const pedidosPorCliente = {};
            let totalGeral = 0;

            snapshot.forEach((docSnap) => {
                const pedido = docSnap.data();
                const cliente = pedido.cliente || 'Desconhecido';
                const valor = parseFloat(pedido.valor) || 0;
                
                if (!pedidosPorCliente[cliente]) {
                    pedidosPorCliente[cliente] = {
                        pedidos: [],
                        total: 0
                    };
                }
                
                pedidosPorCliente[cliente].pedidos.push({
                    produto: pedido.produto,
                    valor: valor,
                    data: pedido.data ? pedido.data.toDate() : new Date(),
                    status: pedido.status
                });
                
                pedidosPorCliente[cliente].total += valor;
                totalGeral += valor;
            });

            // Gerar HTML do relatório — formato compacto de tabela/planilha
            let htmlRelatorio = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Pedidos - Delícias da Tia Rose</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #f5f1f0;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
            background: white;
            padding: 24px;
            border-radius: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 3px solid #6d4c41;
        }
        .header h1 { color: #6d4c41; font-size: 1.7rem; margin-bottom: 4px; }
        .header p { color: #666; font-size: 0.88rem; }
        .resumo-geral {
            background: linear-gradient(135deg, #6d4c41, #5d4037);
            color: white;
            padding: 10px 18px;
            border-radius: 10px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 0.92rem;
            font-weight: bold;
        }
        .resumo-geral .total {
            background: rgba(255,255,255,0.2);
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 1rem;
        }
        /* Tabela principal */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.88rem;
        }
        thead th {
            background: #6d4c41;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-size: 0.8rem;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }
        tbody tr.linha-cliente td {
            padding: 7px 10px;
            vertical-align: top;
            border-bottom: 1px solid #e8ddd9;
        }
        tbody tr.linha-cliente:nth-child(odd) td {
            background: #faf7f2;
        }
        tbody tr.linha-cliente:nth-child(even) td {
            background: #fff;
        }
        /* Linha separadora entre clientes */
        tbody tr.separador td {
            padding: 3px 0;
            background: transparent;
            border: none;
        }
        td.td-cliente {
            font-weight: bold;
            color: #6d4c41;
            white-space: nowrap;
            width: 22%;
        }
        td.td-produtos {
            color: #333;
            line-height: 1.6;
        }
        td.td-produtos span {
            display: block;
        }
        td.td-subtotal {
            font-weight: bold;
            color: #6d4c41;
            text-align: right;
            white-space: nowrap;
            width: 14%;
        }
        .chip-valor {
            display: inline-block;
            background: #faf7f2;
            border: 1px solid #d4a574;
            color: #6d4c41;
            border-radius: 12px;
            padding: 1px 8px;
            font-size: 0.8rem;
            margin-left: 4px;
        }
        .badge-total {
            background: #6d4c41;
            color: white;
            border-radius: 14px;
            padding: 2px 12px;
            font-size: 0.83rem;
        }
        tfoot td {
            padding: 10px;
            background: #f5f1f0;
            font-weight: bold;
            color: #6d4c41;
            border-top: 2px solid #6d4c41;
        }
        .rodape {
            margin-top: 18px;
            padding-top: 12px;
            border-top: 2px solid #6d4c41;
            text-align: center;
            color: #888;
            font-size: 0.82rem;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border-radius: 0; }
            .btn-imprimir { display: none; }
        }
        .btn-imprimir {
            background: linear-gradient(135deg, #25d366, #1da851);
            color: white;
            border: none;
            padding: 10px 28px;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: bold;
            cursor: pointer;
            margin: 16px auto;
            display: block;
            box-shadow: 0 4px 12px rgba(37,211,102,0.3);
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🌸 Delícias da Tia Rose</h1>
        <p>Relatório de Pedidos · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>

    <div class="resumo-geral">
        <span>📊 ${snapshot.size} pedido(s) · ${Object.keys(pedidosPorCliente).length} cliente(s)</span>
        <span class="total">💰 Total Geral: R$ ${totalGeral.toFixed(2).replace('.', ',')}</span>
    </div>

    <table>
        <thead>
            <tr>
                <th>👤 Cliente</th>
                <th>🛒 Produtos Pedidos</th>
                <th style="text-align:right;">💰 Subtotal</th>
            </tr>
        </thead>
        <tbody>
`;

            const clientes = Object.entries(pedidosPorCliente);
            clientes.forEach(([nomeCliente, dados], idx) => {
                // Montar lista de produtos na mesma célula
                const produtosHtml = dados.pedidos.map(p =>
                    `<span>${escapeHtml(p.produto)}<span class="chip-valor">R$ ${p.valor.toFixed(2).replace('.', ',')}</span></span>`
                ).join('');

                htmlRelatorio += `
            <tr class="linha-cliente">
                <td class="td-cliente">👤 ${escapeHtml(nomeCliente)}</td>
                <td class="td-produtos">${produtosHtml}</td>
                <td class="td-subtotal"><span class="badge-total">R$ ${dados.total.toFixed(2).replace('.', ',')}</span></td>
            </tr>
            <tr class="separador"><td colspan="3"></td></tr>
`;
            });

            htmlRelatorio += `
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2">📊 ${snapshot.size} pedido(s) · ${clientes.length} cliente(s)</td>
                <td style="text-align:right;">R$ ${totalGeral.toFixed(2).replace('.', ',')}</td>
            </tr>
        </tfoot>
    </table>

    <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir Relatório</button>

    <div class="rodape">
        <p>Relatório gerado automaticamente pelo sistema</p>
        <p style="margin-top:4px;">Delícias da Tia Rose · Doces feitos com amor ❤️</p>
    </div>
</div>
</body>
</html>
`;

            // Abrir relatório em nova janela
            const janelaRelatorio = window.open('', '_blank');
            if (janelaRelatorio) {
                janelaRelatorio.document.write(htmlRelatorio);
                janelaRelatorio.document.close();
            } else {
                alert('Por favor, permita pop-ups para visualizar o relatório.');
            }

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Erro ao gerar relatório. Tente novamente.');
        }
    };

    // Event listener para o botão de gerar relatório
    const btnGerarRelatorio = document.getElementById('btnGerarRelatorio');
    if (btnGerarRelatorio) {
        btnGerarRelatorio.addEventListener('click', window.gerarRelatorio);
    }

    // Inicializar Firebase e tudo
    inicializarFirebase();
    inicializarIndicadores();
});
