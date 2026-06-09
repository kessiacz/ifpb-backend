"""
Consulta de Editais - IFPB Campus Cajazeiras
=============================================
Estrutura:
  - Página de categoria  → <div class="listing-item document-listing">
                               <a href="/campus/.../ANO"></a> // <a href="/campus/.../ANO-1"></a>
                               <h2>Editais de ANO</h2>
                           </div>

  - Página de ano        → <div class="listing-item edital-listing">
                               <a href="/campus/.../slug"></a>
                               <h2 class="title">Título do edital</h2>
                           </div>
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# ──────────────────────────────────────────────
# Configurações globais
# ──────────────────────────────────────────────

BASE_URL = "https://www.ifpb.edu.br/campus/cajazeiras/editais"

CATEGORIAS = {
    "1": {"nome": "Assistência Estudantil", "url": f"{BASE_URL}/assistencia-estudantil"},
    "2": {"nome": "Direção Geral",           "url": f"{BASE_URL}/direcao-geral"},
    "3": {"nome": "Ensino",                  "url": f"{BASE_URL}/ensino"},
    "4": {"nome": "Extensão",                "url": f"{BASE_URL}/extensao"},
    "5": {"nome": "Inovação",                "url": f"{BASE_URL}/editais-de-inovacao"},
    "6": {"nome": "Pesquisa",                "url": f"{BASE_URL}/editais-de-pesquisa"},
}

SEPARADOR = "─" * 72


# ──────────────────────────────────────────────
# Funções de scraping
# ──────────────────────────────────────────────

def _get_soup(url: str) -> BeautifulSoup | None:
    """Faz a requisição HTTP e retorna o BeautifulSoup, ou None em caso de falha."""
    try:
        resposta = requests.get(url, timeout=15)
        resposta.raise_for_status()
        return BeautifulSoup(resposta.content, "html.parser")
    except requests.RequestException as erro:
        print(f"\n[ERRO] Não foi possível acessar:\n  {url}\n  Detalhe: {erro}\n")
        return None


def buscar_anos_da_categoria(url_categoria: str) -> list[dict]:
    """
    Acessa a página de categoria e retorna os anos disponíveis.

    Cada item é um <div class="listing-item document-listing"> contendo:
      - <a href="/campus/.../ANO">  (href relativo, sem texto)
      - <h2>Editais de ANO</h2>    (sem classe)
    """
    soup = _get_soup(url_categoria)
    if not soup:
        return []

    anos = []
    for card in soup.find_all("div", class_="listing-item"):
        # Página de categoria usa "document-listing"; ignora "edital-listing"
        classes = card.get("class", [])
        if "document-listing" not in classes:
            continue

        link_tag = card.find("a", href=True)
        h2       = card.find("h2")

        if not link_tag or not h2:
            continue

        titulo = h2.get_text(strip=True)
        if not titulo.lower().startswith("editais de"):
            continue

        anos.append({
            "ano": titulo.split()[-1],
            "url": urljoin(url_categoria, link_tag["href"]),
        })

    return anos


def buscar_editais_de_ano(url_ano: str) -> list[dict]:
    """
    Acessa a página de um ano e retorna os editais individuais.

    Cada item é um <div class="listing-item edital-listing"> contendo:
      - <a href="/campus/.../slug">  (href relativo, sem texto)
      - <h2 class="title">Título</h2>

    Retorna: [{"titulo": "...", "link": "..."}, ...]
    """
    soup = _get_soup(url_ano)
    if not soup:
        return []

    editais = []
    for card in soup.find_all("div", class_="listing-item"):
        classes = card.get("class", [])
        if "edital-listing" not in classes:
            continue

        link_tag = card.find("a", href=True)
        titulo   = card.find("h2", class_="title")

        if not link_tag or not titulo:
            continue

        editais.append({
            "titulo": titulo.get_text(strip=True),
            "link":   urljoin(url_ano, link_tag["href"]),
        })

    return editais


def buscar_editais_recentes_principal() -> list[dict]:
    """
    Coleta os editais que aparecem na página principal
    (os mais recentes de todas as categorias).
    """
    soup = _get_soup(BASE_URL)
    if not soup:
        return []

    editais = []
    for card in soup.find_all("div", class_="listing-item"):
        classes = card.get("class", [])
        if "edital-listing" not in classes:
            continue

        link_tag = card.find("a", href=True)
        titulo   = card.find("h2", class_="title")

        if not link_tag or not titulo:
            continue

        editais.append({
            "titulo": titulo.get_text(strip=True),
            "link":   urljoin(BASE_URL, link_tag["href"]),
        })

    return editais


# ──────────────────────────────────────────────
# Funções de exibição
# ──────────────────────────────────────────────

def exibir_editais(editais: list[dict], cabecalho: str = "") -> None:
    """Imprime a lista de editais formatada."""
    print(f"\n{SEPARADOR}")
    if cabecalho:
        print(f"  {cabecalho}")
        print(SEPARADOR)

    if not editais:
        print("  Nenhum edital encontrado.")
        print(SEPARADOR)
        return

    for i, edital in enumerate(editais, start=1):
        print(f"\n  [{i:02d}] {edital['titulo']}")
        print(f"        {edital['link']}")

    print(f"\n{SEPARADOR}")
    print(f"  Total: {len(editais)} edital(is) encontrado(s).")
    print(SEPARADOR)


def exibir_menu_principal() -> None:
    print(f"\n{'═' * 72}")
    print("  EDITAIS – IFPB Campus Cajazeiras")
    print(f"{'═' * 72}")
    print("  (0) Sair")
    for chave, cat in CATEGORIAS.items():
        print(f"  ({chave}) {cat['nome']}")
    print(f"  (T) Todos os editais recentes (página principal)")
    print(f"{'─' * 72}")


# ──────────────────────────────────────────────
# Fluxo de seleção de ano
# ──────────────────────────────────────────────

def selecionar_ano(anos_disponiveis: list[dict]) -> dict | None:
    """
    Exibe os anos e pede escolha. Retorna o dict do ano, {"todos": True}, ou None.
    """
    print("\n  Anos disponíveis nesta categoria:")
    for i, entrada in enumerate(anos_disponiveis, start=1):
        print(f"    ({i}) {entrada['ano']}")

    ultimo = len(anos_disponiveis)
    print(f"    ({ultimo + 1}) Todos os anos desta categoria")
    print(f"    (0) Voltar")

    while True:
        escolha = input("\n  Escolha o ano: ").strip()

        if escolha == "0":
            return None

        if escolha.isdigit():
            idx = int(escolha)
            if 1 <= idx <= ultimo:
                return anos_disponiveis[idx - 1]
            if idx == ultimo + 1:
                return {"todos": True}

        print("  Opção inválida. Digite um número da lista acima.")


def processar_categoria(categoria: dict) -> None:
    """Orquestra a busca e exibição de editais de uma categoria."""
    print(f"\n  Buscando anos disponíveis em '{categoria['nome']}'...")

    anos = buscar_anos_da_categoria(categoria["url"])
    if not anos:
        print("  Nenhum ano encontrado para esta categoria.")
        return

    escolha = selecionar_ano(anos)
    if escolha is None:
        return

    if escolha.get("todos"):
        todos_editais = []
        for entrada in anos:
            print(f"  → Buscando editais de {entrada['ano']}...")
            todos_editais.extend(buscar_editais_de_ano(entrada["url"]))
        exibir_editais(todos_editais, f"Todos os editais – {categoria['nome']}")
        return

    print(f"  → Buscando editais de {escolha['ano']}...")
    editais = buscar_editais_de_ano(escolha["url"])
    exibir_editais(editais, f"{categoria['nome']} – {escolha['ano']}")


# ──────────────────────────────────────────────
# Ponto de entrada
# ──────────────────────────────────────────────

def main() -> None:
    print("\nBem-vindo ao consultor de editais do IFPB Campus Cajazeiras!")

    while True:
        exibir_menu_principal()
        opcao = input("  Escolha uma opção: ").strip()

        if opcao == "0":
            print("\n  Encerrando. Até logo!\n")
            break

        if opcao.upper() == "T":
            print("\n  Buscando editais recentes da página principal...")
            editais = buscar_editais_recentes_principal()
            exibir_editais(editais, "Editais mais recentes (página principal)")
            continue

        if opcao not in CATEGORIAS:
            print("\n  Opção inválida. Digite um número entre 0 e 6, ou T.")
            continue

        processar_categoria(CATEGORIAS[opcao])


if __name__ == "__main__":
    main()