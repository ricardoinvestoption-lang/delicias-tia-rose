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
        const texto = encodeURIComponent(`Olá Tia Rose! Gostaria de encomendar: ${nome}`);
        window.open(`https://wa.me/${fone}?text=${texto}`, '_blank');
    };

    // 2. LÓGICA DO FIREBASE (Aguarda o carregamento dos módulos)
    setTimeout(() => {
        if (!window.dbMetodos) return;

        const { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } = window.dbMetodos;
        const db = window.db;
        const produtosRef = collection(db, "produtos_v2");

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

                        card.innerHTML = `
                            ${btnExcluir}
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