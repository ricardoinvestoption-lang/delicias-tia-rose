document.addEventListener('DOMContentLoaded', () => {
    // 1. FUNÇÕES GLOBAIS (Devem estar disponíveis para o HTML)
    // Isso resolve o problema das setas "travadas"
    window.scrollMenu = function(direcao) {
        const carrossel = document.getElementById('menuCarrossel');
        if (carrossel) {
            const larguraCard = carrossel.offsetWidth;
            carrossel.scrollBy({
                left: direcao * larguraCard,
                behavior: 'smooth'
            });
        }
    };

    window.encomendar = (nome) => {
        const fone = "5516991839509"; 
        const texto = encodeURIComponent(`Olá Rose! Gostaria de encomendar: ${nome}`);
        window.open(`https://wa.me/${fone}?text=${texto}`, '_blank');
    };

    // 2. LÓGICA DO FIREBASE (Aguarda o carregamento dos módulos)
    setTimeout(() => {
        if (!window.dbMetodos) return;

        const { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, getDoc } = window.dbMetodos;
        const db = window.db;
        const produtosRef = collection(db, "produtos_v2");

        // --- CARREGAR BANNER DO FIREBASE AO INICIAR ---
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

        // --- SALVAR BANNER NO FIREBASE ---
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

        // --- BOTÕES "SAIBA MAIS" (SCROLL PARA AS VITRINES) ---
        document.querySelectorAll('.btn-filtro').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const elemento = document.getElementById(targetId);
                if (elemento) {
                    window.scrollTo({
                        top: elemento.offsetTop - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // --- EXCLUIR PRODUTO (Global para o Firebase) ---
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

                        // Badge especial para promoções
                        const badgePromocao = p.categoria === 'PROMOCAO' ? 
                            `<div style="background:#e91e63;color:white;font-size:0.75rem;font-weight:bold;padding:4px 10px;text-align:center;">🔥 PROMOÇÃO</div>` : '';

                        card.innerHTML = `
                            ${btnExcluir}
                            ${badgePromocao}
                            <img src="${p.urlImagem}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Imagem+nao+encontrada'">
                            <div style="padding:15px">
                                <h3 style="margin:0; font-size:1.1rem">${p.nome}</h3>
                                <p style="color:#8c6239; font-weight:bold; margin:10px 0">R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}</p>
                                <button class="btn-whats" onclick="encomendar('${p.nome}')">Pedir no WhatsApp</button>
                            </div>
                        `;
                        container.appendChild(card);
                    }
                });

                // Promoções sempre visível
                const secaoPromocoes = document.getElementById('secao-promocoes');
                if (secaoPromocoes) secaoPromocoes.style.display = 'block';
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
    }, 1200);
});