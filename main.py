import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://www.ifpb.edu.br/campus/cajazeiras/editais"

categorias = {
    "1": {
        "nome": "Assistência Estudantil",
        "url": f"{BASE_URL}/assistencia-estudantil"
    },
    "2": {
        "nome": "Direção Geral",
        "url": f"{BASE_URL}/direcao-geral"
    },
    "3": {
        "nome": "Ensino",
        "url": f"{BASE_URL}/ensino"
    },
    "4": {
        "nome": "Extensão",
        "url": f"{BASE_URL}/extensao"
    },
    "5": {
        "nome": "Inovação",
        "url": f"{BASE_URL}/editais-de-inovacao"
    },
    "6": {
        "nome": "Pesquisa",
        "url": f"{BASE_URL}/editais-de-pesquisa"
    }
}


def get_soup(url):

    try:

        resposta = requests.get(url, timeout=15)
        resposta.raise_for_status()

        return BeautifulSoup(resposta.content, "html.parser")

    except requests.RequestException as erro:

        print(f"\nErro ao acessar o site.")
        print(erro)

        return None


def buscar_anos_categoria(url_categoria):

    soup = get_soup(url_categoria)

    if not soup:
        return []

    anos = []

    cards = soup.find_all("div", class_="listing-item")

    for card in cards:

        classes = card.get("class", [])

        # pega apenas os cards de ano
        if "document-listing" not in classes:
            continue

        link = card.find("a", href=True)
        titulo = card.find("h2")

        if not link or not titulo:
            continue

        texto = titulo.get_text(strip=True)

        if not texto.lower().startswith("editais de"):
            continue

        anos.append({
            "ano": texto.split()[-1],
            "url": urljoin(url_categoria, link["href"])
        })

    return anos


def buscar_editais_ano(url_ano):

    soup = get_soup(url_ano)

    if not soup:
        return []

    editais = []

    cards = soup.find_all("div", class_="listing-item")

    for card in cards:

        classes = card.get("class", [])

        # pega apenas os editais
        if "edital-listing" not in classes:
            continue

        link = card.find("a", href=True)
        titulo = card.find("h2", class_="title")

        if not link or not titulo:
            continue

        editais.append({
            "titulo": titulo.get_text(strip=True),
            "link": urljoin(url_ano, link["href"])
        })

    return editais


def buscar_editais_recentes():

    soup = get_soup(BASE_URL)

    if not soup:
        return []

    editais = []

    cards = soup.find_all("div", class_="listing-item")

    for card in cards:

        classes = card.get("class", [])

        if "edital-listing" not in classes:
            continue

        link = card.find("a", href=True)
        titulo = card.find("h2", class_="title")

        if not link or not titulo:
            continue

        editais.append({
            "titulo": titulo.get_text(strip=True),
            "link": urljoin(BASE_URL, link["href"])
        })

    return editais


def mostrar_editais(editais, titulo=""):

    print("\n" + "-" * 80)

    if titulo:
        print(titulo)
        print("-" * 80)

    if not editais:
        print("Nenhum edital encontrado.")
        print("-" * 80)
        return

    for i, edital in enumerate(editais, start=1):

        print(f"\n[{i}] {edital['titulo']}")
        print(edital["link"])

    print("\n" + "-" * 80)
    print(f"Total encontrados: {len(editais)}")
    print("-" * 80)


def selecionar_ano(anos):

    print("\nAnos disponíveis:\n")

    for i, ano in enumerate(anos, start=1):
        print(f"({i}) {ano['ano']}")

    ultimo = len(anos)

    print(f"({ultimo + 1}) Todos os anos")
    print("(0) Voltar")

    while True:

        escolha = input("\nEscolha uma opção: ").strip()

        if escolha == "0":
            return None

        if escolha.isdigit():

            escolha = int(escolha)

            if 1 <= escolha <= ultimo:
                return anos[escolha - 1]

            if escolha == ultimo + 1:
                return {"todos": True}

        print("Opção inválida.")


def processar_categoria(categoria):

    print(f"\nBuscando anos de {categoria['nome']}...")

    anos = buscar_anos_categoria(categoria["url"])

    if not anos:
        print("Nenhum ano encontrado.")
        return

    escolha = selecionar_ano(anos)

    if escolha is None:
        return

    # buscar todos os anos
    if escolha.get("todos"):

        todos_editais = []

        for ano in anos:

            print(f"\nBuscando editais de {ano['ano']}...")

            editais = buscar_editais_ano(ano["url"])

            todos_editais.extend(editais)

        mostrar_editais(
            todos_editais,
            f"Todos os editais - {categoria['nome']}"
        )

        return

    # buscar ano específico
    print(f"\nBuscando editais de {escolha['ano']}...")

    editais = buscar_editais_ano(escolha["url"])

    mostrar_editais(
        editais,
        f"{categoria['nome']} - {escolha['ano']}"
    )


def mostrar_menu():

    print("\n" + "=" * 80)
    print("EDITAIS IFPB - CAMPUS CAJAZEIRAS")
    print("=" * 80)

    print("(0) Sair")

    for chave, categoria in categorias.items():
        print(f"({chave}) {categoria['nome']}")

    print("(T) Todos os editais recentes")

    print("-" * 80)


def main():

    print("\nBem-vindo ao sistema de consulta de editais do IFPB.\n")

    while True:

        mostrar_menu()

        opcao = input("Escolha uma opção: ").strip()

        if opcao == "0":

            print("\nPrograma encerrado.\n")

            break

        if opcao.upper() == "T":

            print("\nBuscando editais recentes...")

            editais = buscar_editais_recentes()

            mostrar_editais(
                editais,
                "Editais recentes"
            )

            continue

        if opcao not in categorias:

            print("\nOpção inválida.")

            continue

        processar_categoria(categorias[opcao])


if __name__ == "__main__":
    main()