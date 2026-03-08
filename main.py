import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin


class GetInfoIFPB:

    def extrair_editais(self, url):
        page = requests.get(url)
        if page.status_code != 200:
            return []

        soup = BeautifulSoup(page.content, 'html.parser')
        editais = []

        cards = soup.find_all("div", class_="listing-item edital-listing")

        for card in cards:
            link_tag = card.find("a")
            titulo = card.find("h2", class_="title")

            if not link_tag or not titulo:
                continue

            link = urljoin(url, link_tag.get("href"))
            nome = titulo.get_text(strip=True)
            editais.append({link: nome})

        return editais

    def get_editaisDirecaoGeralCZAno(self, ano):
        return self.extrair_editais(f"https://www.ifpb.edu.br/campus/cajazeiras/editais/direcao-geral/{ano}")

    def get_editaisPesquisaAno(self, ano):
        return self.extrair_editais(f"https://www.ifpb.edu.br/campus/cajazeiras/editais/pesquisa/{ano}")

    def get_editaisExtensaoAno(self, ano):
        return self.extrair_editais(f"https://www.ifpb.edu.br/campus/cajazeiras/editais/extensao/{ano}")

    def get_editaisAssistenciaAno(self, ano):
        return self.extrair_editais(f"https://www.ifpb.edu.br/campus/cajazeiras/editais/assistencia-estudantil/{ano}")

    def get_editaisEnsinoAno(self, ano):
        return self.extrair_editais(f"https://www.ifpb.edu.br/campus/cajazeiras/editais/ensino/{ano}")

    def get_editaisInovacaoAno(self, ano):
        return self.extrair_editais(f"https://www.ifpb.edu.br/campus/cajazeiras/editais/inovacao/{ano}")


def mostrar_editais(editais):
    if not editais:
        print("Nenhum edital encontrado para este ano.")
        print("-" * 77)
        return

    for edital in editais:
        for link, nome in edital.items():
            print("-" * 77)
            print(f"{nome}\n{link}")

    print("-" * 77)


if __name__ == "__main__":

    ifcz = GetInfoIFPB()

    while True:
        op = int(input(
            "(0) Sair\n"
            "(1) Direção Geral\n"
            "(2) Pesquisa\n"
            "(3) Extensão\n"
            "(4) Assistência Estudantil\n"
            "(5) Ensino\n"
            "(6) Inovação\n"
            "Escolha uma opção: "
        ))

        if op == 0:
            break

        ano = int(input("Digite o ano desejado (ou 0 para voltar): "))

        if ano == 0 or ano <= 2015 or ano > datetime.now().year:
            print("Ano inválido ou sem editais.")
            continue

        if op == 1:
            editais = ifcz.get_editaisDirecaoGeralCZAno(ano)
        elif op == 2:
            editais = ifcz.get_editaisPesquisaAno(ano)
        elif op == 3:
            editais = ifcz.get_editaisExtensaoAno(ano)
        elif op == 4:
            editais = ifcz.get_editaisAssistenciaAno(ano)
        elif op == 5:
            editais = ifcz.get_editaisEnsinoAno(ano)
        elif op == 6:
            editais = ifcz.get_editaisInovacaoAno(ano)
        else:
            print("Opção inválida.")
            continue

        mostrar_editais(editais)
