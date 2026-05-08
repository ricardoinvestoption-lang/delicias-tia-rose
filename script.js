document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // 1. CARRINHO DE COMPRAS
    // =============================================
    let carrinho = []; // [{ nome, preco, quantidade }]

    function atualizarContador() {
        const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        const contador = document.getElementById('carrinho-contador');
        const btn = document.getElementById('btn-carrinho-flutuante');
        contador.textContent = total;
        if (total > 0) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
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

        lista.innerHTML = '';

        if (carrinho.length === 0) {
            vazio.style.display = 'block';
            footer.style.display = 'none';
            return;
        }

        vazio.style.display = 'none';
        footer.style.display = 'block';

        carrinho.forEach((item, index) => {
            const subtotal = item.preco * item.quantidade;
            const div = document.createElement('div');
            div.className = 'carrinho-item';
            div.innerHTML = `
                <div class="carrinho-item-info">
                    <span class="carrinho-item-nome">${item.nome}</span>
                    <span class="carrinho-item-unitario">
                        ${formatarMoeda(item.preco)} × ${item.quantidade} = 
                        <strong>${formatarMoeda(subtotal)}</strong>
                    </span>
                </div>
                <div class="carrinho-item-controles">
                    <button class="btn-qtd" onclick="alterarQuantidade(${index}, -1)">−</button>
                    <span class="carrinho-item-qtd">${item.quantidade}</span>
                    <button class="btn-qtd" onclick="alterarQuantidade(${index}, 1)">+</button>
                    <button class="btn-remover-item" onclick="removerItem(${index})" title="Remover">🗑️</button>
                </div>
            `;
            lista.appendChild(div);
        });

        // Linha separadora + total
        const totalDiv = document.createElement('div');
        totalDiv.className = 'carrinho-resumo';
        totalDiv.innerHTML = `
            <span>${carrinho.length} ${carrinho.length === 1 ? 'item' : 'itens'} no carrinho</span>
            <span class="carrinho-total-destaque">${formatarMoeda(calcularTotal())}</span>
        `;
        lista.appendChild(totalDiv);

        // Atualiza o total no footer também
        document.getElementById('carrinho-total-valor').textContent = formatarMoeda(calcularTotal());
    }

    window.alterarQuantidade = (index, delta) => {
        carrinho[index].quantidade += delta;
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
        atualizarContador();
        renderizarCarrinho();
    };

    window.removerItem = (index) => {
        carrinho.splice(index, 1);
        atualizarContador();
        renderizarCarrinho();
    };

    window.adicionarAoCarrinho = (nome, preco) => {
        const existente = carrinho.find(i => i.nome === nome);
        if (existente) {
            existente.quantidade++;
        } else {
            carrinho.push({ nome, preco: parseFloat(preco), quantidade: 1 });
        }
        atualizarContador();

        // Feedback visual em TODOS os botões desse produto (pode ter em promoção + vitrine)
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

    window.abrirCarrinho = () => {
        renderizarCarrinho();
        document.getElementById('modal-carrinho').style.display = 'flex';
    };

    window.fecharCarrinho = () => {
        document.getElementById('modal-carrinho').style.display = 'none';
    };

    // Fecha ao clicar fora do box
    document.getElementById('modal-carrinho').addEventListener('click', (e) => {
        if (e.target.id === 'modal-carrinho') fecharCarrinho();
    });

    // =============================================
    // 2. MODAL DE NOME / CONFIRMAR PEDIDO
    // =============================================
    window.abrirModalNome = () => {
        if (carrinho.length === 0) return;
        fecharCarrinho();
        document.getElementById('modal-input-nome').value = '';
        document.getElementById('modal-input-nome').style.border = '1.5px solid #ddd';
        document.getElementById('modal-pedido').style.display = 'flex';
        setTimeout(() => document.getElementById('modal-input-nome').focus(), 100);
    };

    window.fecharModalPedido = () => {
        document.getElementById('modal-pedido').style.display = 'none';
    };

    window.confirmarPedido = () => {
        const nomeCliente = document.getElementById('modal-input-nome').value.trim();
        if (!nomeCliente) {
            document.getElementById('modal-input-nome').style.border = '2px solid #e91e63';
            return;
        }

        // Monta a mensagem com todos os itens
        const linhas = carrinho.map(item =>
            `• ${item.quantidade}x ${item.nome} — ${formatarMoeda(item.preco * item.quantidade)}`
        );
        const total = calcularTotal();
        const mensagem =
            `Olá Rose! Eu sou *${nomeCliente}* e gostaria de fazer o seguinte pedido:\n\n` +
            linhas.join('\n') +
            `\n\n*Total: ${formatarMoeda(total)}*`;

        const fone = "5516991839509";
        // Abre o WhatsApp IMEDIATAMENTE (dentro do clique = sem bloqueio no mobile)
        window.location.href = `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;

        fecharModalPedido();

        // Salva cada item no Firestore em background
        if (window.dbMetodos && window.db) {
            const { collection, addDoc, serverTimestamp } = window.dbMetodos;
            const dataHora = serverTimestamp();
            carrinho.forEach(item => {
                addDoc(collection(window.db, "pedidos"), {
                    cliente: nomeCliente,
                    produto: `${item.quantidade}x ${item.nome}`,
                    valor: (item.preco * item.quantidade).toFixed(2),
                    status: "novo",
                    data: dataHora
                }).catch(e => console.error("Erro ao salvar pedido:", e));
            });
        }

        // Limpa o carrinho após enviar
        carrinho = [];
        atualizarContador();
    };

    // =============================================
    // 3. CARROSSEL / NAVEGAÇÃO
    // =============================================
    window.scrollMenu = function(direcao) {
        const carrossel = document.getElementById('menuCarrossel');
        if (carrossel) {
            const larguraCard = carrossel.firstElementChild
                ? carrossel.firstElementChild.offsetWidth + 12
                : carrossel.offsetWidth;
            carrossel.scrollBy({ left: direcao * larguraCard, behavior: 'smooth' });
        }
    };

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
            const larguraCard = cards[0] ? cards[0].offsetWidth + 12 : carrossel.offsetWidth;
            const index = Math.round(carrossel.scrollLeft / larguraCard);
            container.querySelectorAll('.indicador').forEach((dot, i) => {
                dot.classList.toggle('ativo', i === index);
            });
        });
    }

    function inicializarSwipe() {
        const carrossel = document.getElementById('menuCarrossel');
        if (!carrossel) return;
        let startX = 0;
        carrossel.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        carrossel.addEventListener('touchend', e => {
            // scroll nativo já cuida do snap
        }, { passive: true });
    }

    inicializarIndicadores();
    inicializarSwipe();

    // =============================================
    // 4. BOTÕES "SAIBA MAIS" — TOGGLE VITRINE
    // =============================================
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const elemento = document.getElementById(targetId);
            if (!elemento) return;

            const jaAberto = elemento.classList.contains('visivel');
            if (jaAberto) {
                elemento.classList.remove('visivel');
                elemento.style.display = 'none';
            } else {
                elemento.classList.add('visivel');
                setTimeout(() => {
                    window.scrollTo({ top: elemento.offsetTop - 20, behavior: 'smooth' });
                }, 50);
            }
        });
    });

    // =============================================
    // 5. FIREBASE
    // =============================================
    setTimeout(() => {
        if (!window.dbMetodos) return;

        const { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, getDoc, updateDoc, serverTimestamp } = window.dbMetodos;
        const db = window.db;
        const produtosRef = collection(db, "produtos_v2");

        // --- BANNER ---
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
            } catch (e) {}
        }
        carregarBanner();

        window.salvarBanner = async function() {
            const texto = document.getElementById('textoBanner').value.trim();
            if (!texto) { alert("Digite uma mensagem para o banner!"); return; }
            try {
                await setDoc(doc(db, "configuracoes", "banner"), { texto, visivel: true });
                document.getElementById('texto-aviso').textContent = texto;
                document.getElementById('banner-aviso').style.display = 'flex';
                alert("✅ Banner atualizado com sucesso!");
            } catch (e) {
                alert("Erro ao salvar banner. Verifique a conexão.");
            }
        };

        const doceForm = document.getElementById('doceForm');
        const adminSection = document.getElementById('admin-section');
        let cliques = 0;

        // --- MODO ADMIN (3 cliques no título) ---
        document.getElementById('titulo-principal').addEventListener('click', () => {
            cliques++;
            if (cliques === 3) {
                adminSection.style.display = 'block';
                alert("Modo Administrativo Ativado!");
                inicializarVitrine();
                cliques = 0;
            }
        });

        // --- EXCLUIR PRODUTO ---
        window.excluirProduto = async (id) => {
            if (confirm("Deseja remover este produto da nuvem?")) {
                await deleteDoc(doc(db, "produtos_v2", id));
            }
        };

        // --- VITRINE ---
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

                snapshot.forEach((docSnap) => {
                    const p = docSnap.data();
                    const id = docSnap.id;
                    const listaId = listas[p.categoria];

                    if (listaId) {
                        const container = document.getElementById(listaId);
                        const card = document.createElement('div');
                        card.className = 'card';
                        card.style.position = 'relative';

                        const estaNoModoAdmin = adminSection.style.display === 'block';
                        const btnExcluir = estaNoModoAdmin
                            ? `<button class="btn-remover" onclick="excluirProduto('${id}')" style="position:absolute;top:5px;right:5px;background:red;color:white;border:none;border-radius:50%;width:25px;height:25px;cursor:pointer;z-index:10;">×</button>`
                            : '';

                        const badgePromocao = p.categoria === 'PROMOCAO'
                            ? `<div style="background:#e91e63;color:white;font-size:0.75rem;font-weight:bold;padding:4px 10px;text-align:center;">🔥 PROMOÇÃO</div>`
                            : '';

                        const precoFormatado = parseFloat(p.preco).toFixed(2).replace('.', ',');
                        // Escapa aspas simples no nome para não quebrar o onclick
                        const nomeSeguro = p.nome.replace(/'/g, "\\'");

                        card.innerHTML = `
                            ${btnExcluir}
                            ${badgePromocao}
                            <img src="${p.urlImagem}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+nao+encontrada'">
                            <div style="padding:15px">
                                <h3 style="margin:0; font-size:1.1rem">${p.nome}</h3>
                                <p style="color:#8c6239; font-weight:bold; margin:10px 0">R$ ${precoFormatado}</p>
                                <button
                                    class="btn-whats btn-adicionar-carrinho"
                                    data-nome="${p.nome}"
                                    onclick="adicionarAoCarrinho('${nomeSeguro}', '${p.preco}')">
                                    🛒 Adicionar
                                </button>
                            </div>
                        `;
                        container.appendChild(card);
                    }
                });

                // Promoções sempre visíveis
                const secaoPromocoes = document.getElementById('secao-promocoes');
                if (secaoPromocoes) {
                    secaoPromocoes.style.display = 'block';
                    secaoPromocoes.classList.add('visivel');
                }
            });
        }

        // --- FORMULÁRIO DE CADASTRO ---
        doceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = doceForm.querySelector('button');
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Salvando...";
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
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Salvar na Nuvem";
            }
        });

        inicializarVitrine();

        // --- GERENCIAR STATUS DE PEDIDO ---
        window.marcarComoEntregue = async (id) => {
            await updateDoc(doc(window.db, "pedidos", id), { status: "concluído" });
        };

        window.excluirPedido = async (id) => {
            if (confirm("Excluir este registro de pedido?")) {
                await deleteDoc(doc(window.db, "pedidos", id));
            }
        };

        // --- PAINEL DE PEDIDOS COM SOMA POR CLIENTE E TOTAL GERAL ---
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

                // Agrupa pedidos por cliente
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

                // --- RESUMO GERAL NO TOPO ---
                const resumo = document.createElement('div');
                resumo.style = `
                    background: linear-gradient(135deg, #e91e63, #c2185b);
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

                // --- BLOCO POR CLIENTE ---
                Object.entries(pedidosPorCliente).forEach(([nomeCliente, dados]) => {

                    // Cabeçalho do cliente com subtotal
                    const headerCliente = document.createElement('div');
                    headerCliente.style = `
                        background: linear-gradient(135deg, #fce4ec, #fff0f5);
                        border: 1.5px solid #e91e63;
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
                        <span style="font-weight:bold; color:#c2185b; font-size:1rem;">👤 ${nomeCliente}</span>
                        <span style="background:#c2185b; color:white; padding:4px 14px; border-radius:20px; font-size:0.9rem; font-weight:bold;">
                            Subtotal: R$ ${dados.total.toFixed(2).replace('.', ',')}
                        </span>
                    `;
                    container.appendChild(headerCliente);

                    // Pedidos individuais do cliente
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
                        cardPedido.style = `
                            padding: 10px 14px;
                            border-left: 5px solid ${isNovo ? '#e91e63' : '#25d366'};
                            background: #f9f9f9;
                            border-radius: 0 8px 8px 0;
                            margin-top: 6px;
                            margin-left: 10px;
                            box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
                        `;
                        cardPedido.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="color:#8c6239; font-weight:bold;">${pedido.produto}</span>
                                    <span style="margin-left:8px; background:#fff3e0; color:#8c6239; border:1px solid #ffcc80; padding:2px 10px; border-radius:20px; font-size:0.85rem; font-weight:bold;">
                                        ${valorFormatado}
                                    </span><br>
                                    <small style="color:#888;">
                                        ${dataFormata} · Status: 
                                        <b style="color:${isNovo ? '#e91e63' : '#25d366'}">${pedido.status}</b>
                                    </small>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    ${isNovo
                                        ? `<button onclick="marcarComoEntregue('${id}')" style="background:#25d366; color:white; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-size:0.85rem;">✅ Concluir</button>`
                                        : ''}
                                    <button onclick="excluirPedido('${id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:1.1rem;">🗑️</button>
                                </div>
                            </div>
                        `;
                        container.appendChild(cardPedido);
                    });
                });
            });
        }

        monitorarPedidos();
    }, 1200);
});
