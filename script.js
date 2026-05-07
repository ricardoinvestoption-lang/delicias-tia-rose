document.addEventListener('DOMContentLoaded', () => {
    // 1. FUNÇÕES GLOBAIS
    window.scrollMenu = function(direcao) {
        const carrossel = document.getElementById('menuCarrossel');
        if (carrossel) {
            // Largura de um card = largura visível do scroll (sem padding)
            const larguraCard = carrossel.firstElementChild
                ? carrossel.firstElementChild.offsetWidth + 12 // 12 = gap
                : carrossel.offsetWidth;
            carrossel.scrollBy({
                left: direcao * larguraCard,
                behavior: 'smooth'
            });
        }
    };

    // Armazena produto atual enquanto o modal está aberto
    let _pedidoProduto = '';
    let _pedidoPreco = '';

    // Abre o modal bonito no lugar do prompt() nativo
    window.encomendar = (nomeProduto, preco) => {
        _pedidoProduto = nomeProduto;
        _pedidoPreco = preco;
        document.getElementById('modal-nome-produto').textContent = `Produto: ${nomeProduto}`;
        document.getElementById('modal-input-nome').value = '';
        document.getElementById('modal-pedido').style.display = 'flex';
        setTimeout(() => document.getElementById('modal-input-nome').focus(), 100);
    };

    window.fecharModalPedido = () => {
        document.getElementById('modal-pedido').style.display = 'none';
    };

    // Chamada DIRETAMENTE pelo clique do botão no modal — sem await antes do open
    window.confirmarPedido = () => {
        const nomeCliente = document.getElementById('modal-input-nome').value.trim();
        if (!nomeCliente) {
            document.getElementById('modal-input-nome').style.border = '2px solid #e91e63';
            return;
        }

        const fone = "5516991839509";
        const texto = encodeURIComponent(`Olá Rose! Eu sou ${nomeCliente} e gostaria de encomendar: ${_pedidoProduto} pelo site.`);

        // Abre o WhatsApp IMEDIATAMENTE (dentro do clique = sem bloqueio no mobile)
        window.location.href = `https://wa.me/${fone}?text=${texto}`;

        // Fecha o modal
        fecharModalPedido();

        // Salva no Firestore em background (não bloqueia o WhatsApp)
        if (window.dbMetodos && window.db) {
            const { collection, addDoc, serverTimestamp } = window.dbMetodos;
            addDoc(collection(window.db, "pedidos"), {
                cliente: nomeCliente,
                produto: _pedidoProduto,
                valor: _pedidoPreco,
                status: "novo",
                data: serverTimestamp()
            }).catch(e => console.error("Erro ao salvar pedido:", e));
        }
    };

    // Funções para gerenciar o status do pedido
    window.marcarComoEntregue = async (id) => {
        const { updateDoc, doc } = window.dbMetodos;
        await updateDoc(doc(window.db, "pedidos", id), { status: "concluído" });
    };

    window.excluirPedido = async (id) => {
        if (confirm("Excluir este registro de pedido?")) {
            const { deleteDoc, doc } = window.dbMetodos;
            await deleteDoc(doc(window.db, "pedidos", id));
        }
    };

    // --- INDICADORES DE PÁGINA (BOLINHAS) ---
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
            const larguraCard = cards[0]
                ? cards[0].offsetWidth + 12
                : carrossel.offsetWidth;
            const index = Math.round(carrossel.scrollLeft / larguraCard);
            container.querySelectorAll('.indicador').forEach((dot, i) => {
                dot.classList.toggle('ativo', i === index);
            });
        });
    }

    // --- SWIPE (TOUCH) NO CARROSSEL ---
    function inicializarSwipe() {
        const carrossel = document.getElementById('menuCarrossel');
        if (!carrossel) return;

        let startX = 0;
        carrossel.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        carrossel.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].clientX;
            // Só dispara se o movimento for pequeno (tap, não scroll)
            // O scroll nativo já cuida do swipe; isso é só para garantir o snap
        }, { passive: true });
    }

    inicializarIndicadores();
    inicializarSwipe();

    // --- BOTÕES "SAIBA MAIS" — TOGGLE DA VITRINE ---
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const elemento = document.getElementById(targetId);
            if (!elemento) return;

            const jaAberto = elemento.classList.contains('visivel');

            if (jaAberto) {
                // Fecha a seção
                elemento.classList.remove('visivel');
                elemento.style.display = 'none';
            } else {
                // Abre a seção e rola até ela
                elemento.classList.add('visivel');
                setTimeout(() => {
                    window.scrollTo({
                        top: elemento.offsetTop - 20,
                        behavior: 'smooth'
                    });
                }, 50);
            }
        });
    });

    // 2. LÓGICA DO FIREBASE
    setTimeout(() => {
        if (!window.dbMetodos) return;

        const { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, getDoc, updateDoc, serverTimestamp } = window.dbMetodos;
        const db = window.db;
        const produtosRef = collection(db, "produtos_v2");

        // --- CARREGAR BANNER DO FIREBASE ---
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

        // --- SALVAR BANNER ---
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

        // --- CARREGAR VITRINE ---
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
                        const btnExcluir = estaNoModoAdmin ?
                            `<button class="btn-remover" onclick="excluirProduto('${id}')" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; z-index: 10;">×</button>` : '';

                        const badgePromocao = p.categoria === 'PROMOCAO' ?
                            `<div style="background:#e91e63;color:white;font-size:0.75rem;font-weight:bold;padding:4px 10px;text-align:center;">🔥 PROMOÇÃO</div>` : '';

                        card.innerHTML = `
                            ${btnExcluir}
                            ${badgePromocao}
                            <img src="${p.urlImagem}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+nao+encontrada'">
                            <div style="padding:15px">
                                <h3 style="margin:0; font-size:1.1rem">${p.nome}</h3>
                                <p style="color:#8c6239; font-weight:bold; margin:10px 0">R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}</p>
                                <button class="btn-whats" onclick="encomendar('${p.nome}', '${p.preco}')">Pedir no WhatsApp</button>
                            </div>
                        `;
                        container.appendChild(card);
                    }
                });

                // Promoções sempre visível
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

        // --- MONITORAR PEDIDOS (PAINEL ADMIN) ---
        function monitorarPedidos() {
            const q = query(collection(db, "pedidos"), orderBy("data", "desc"));

            onSnapshot(q, (snapshot) => {
                const container = document.getElementById('lista-pedidos-admin');
                if (!container) return;
                container.innerHTML = '';

                // Agrupa pedidos por cliente para calcular total
                const pedidosPorCliente = {};
                snapshot.forEach((docSnap) => {
                    const pedido = docSnap.data();
                    const cliente = pedido.cliente || 'Desconhecido';
                    if (!pedidosPorCliente[cliente]) {
                        pedidosPorCliente[cliente] = { total: 0, pedidos: [] };
                    }
                    const valor = parseFloat(pedido.valor) || 0;
                    pedidosPorCliente[cliente].total += valor;
                    pedidosPorCliente[cliente].pedidos.push({ ...pedido, id: docSnap.id });
                });

                // Renderiza agrupado por cliente
                Object.entries(pedidosPorCliente).forEach(([nomeCliente, dados]) => {
                    // Cabeçalho do cliente com total
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
                    `;
                    headerCliente.innerHTML = `
                        <span style="font-weight:bold; color:#c2185b; font-size:1rem;">👤 ${nomeCliente}</span>
                        <span style="background:#c2185b; color:white; padding:4px 12px; border-radius:20px; font-size:0.9rem; font-weight:bold;">
                            Total: R$ ${dados.total.toFixed(2).replace('.', ',')}
                        </span>
                    `;
                    container.appendChild(headerCliente);

                    // Pedidos do cliente
                    dados.pedidos.forEach((pedido) => {
                        const id = pedido.id;
                        const dataFormata = pedido.data ? pedido.data.toDate().toLocaleString('pt-BR') : 'Processando...';
                        const valorFormatado = pedido.valor
                            ? `R$ ${parseFloat(pedido.valor).toFixed(2).replace('.', ',')}`
                            : 'Valor não informado';

                        const cardPedido = document.createElement('div');
                        cardPedido.style = `
                            padding: 10px 14px;
                            border-left: 5px solid ${pedido.status === 'novo' ? '#e91e63' : '#25d366'};
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
                                    <span style="margin-left:10px; background:#fff3e0; color:#8c6239; border:1px solid #ffcc80; padding:2px 10px; border-radius:20px; font-size:0.85rem; font-weight:bold;">${valorFormatado}</span><br>
                                    <small style="color:#888;">${dataFormata} | Status: <b style="color:${pedido.status === 'novo' ? '#e91e63' : '#25d366'}">${pedido.status}</b></small>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    ${pedido.status === 'novo' ? `<button onclick="marcarComoEntregue('${id}')" style="background:#25d366; color:white; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-size:0.85rem;">✅ Concluir</button>` : ''}
                                    <button onclick="excluirPedido('${id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:1.1rem;">🗑️</button>
                                </div>
                            </div>
                        `;
                        container.appendChild(cardPedido);
                    });
                });

                // Resumo geral no topo
                let totalGeral = 0;
                let totalPedidos = 0;
                snapshot.forEach((docSnap) => {
                    totalGeral += parseFloat(docSnap.data().valor) || 0;
                    totalPedidos++;
                });

                if (totalPedidos > 0) {
                    const resumo = document.createElement('div');
                    resumo.style = `
                        background: linear-gradient(135deg, #e91e63, #c2185b);
                        color: white;
                        border-radius: 10px;
                        padding: 12px 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 4px;
                        font-weight: bold;
                    `;
                    resumo.innerHTML = `
                        <span>📊 ${totalPedidos} pedido(s) | ${Object.keys(pedidosPorCliente).length} cliente(s)</span>
                        <span style="font-size:1.1rem;">💰 Total Geral: R$ ${totalGeral.toFixed(2).replace('.', ',')}</span>
                    `;
                    container.prepend(resumo);
                }
            });
        }

        monitorarPedidos();
    }, 1200);
});
