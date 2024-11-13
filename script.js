let desfibriladores = [];
let map, directionsService, directionsRenderer;

// Função para inicializar o mapa
function initMap() {
    // Localização: Montes Claros
    const montesClaros = { lat: -16.7353, lng: -43.8578 };

    // Criar o mapa
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: montesClaros,
    });

    // Inicializar o serviço e renderizador de rotas
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Carregar dados do JSON e listar na tabela e no mapa
    fetch('desfibriladores.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo JSON');
            }
            return response.json();
        })
        .then(data => {
            desfibriladores = data;
            atualizarDesfibriladores(map);
        })
        .catch(error => console.error('Erro ao carregar dados:', error));
}

// Função para buscar a localização do usuário e encontrar o desfibrilador mais próximo
function buscarProximos() {
    const raio = 5000; // Convertendo para metros

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Filtrar desfibriladores dentro do raio e encontrar o mais próximo
                const proximosDesfibriladores = desfibriladores.filter((desfibrilador) => {
                    const desfibLocation = {
                        lat: parseFloat(desfibrilador.latitude),
                        lng: parseFloat(desfibrilador.longitude)
                    };
                    return calcularDistancia(userLocation, desfibLocation) <= raio;
                });

                if (proximosDesfibriladores.length > 0) {
                    // Encontre o desfibrilador mais próximo
                    let desfibriladorMaisProximo = proximosDesfibriladores.reduce((maisProximo, atual) => {
                        const distanciaAtual = calcularDistancia(userLocation, {
                            lat: parseFloat(atual.latitude),
                            lng: parseFloat(atual.longitude)
                        });
                        const distanciaMaisProximo = calcularDistancia(userLocation, {
                            lat: parseFloat(maisProximo.latitude),
                            lng: parseFloat(maisProximo.longitude)
                        });
                        return distanciaAtual < distanciaMaisProximo ? atual : maisProximo;
                    });

                    // Criar a rota para o desfibrilador mais próximo
                    criarRota(userLocation, {
                        lat: parseFloat(desfibriladorMaisProximo.latitude),
                        lng: parseFloat(desfibriladorMaisProximo.longitude)
                    });
                } else {
                    alert("Nenhum desfibrilador encontrado dentro do raio especificado.");
                }

                atualizarListaEMapa(proximosDesfibriladores);
            },
            (error) => {
                console.error("Erro ao obter localização:", error);
            }
        );
    } else {
        alert("Geolocalização não é suportada pelo navegador.");
    }
}

// Função para calcular a distância entre duas coordenadas (em metros)
function calcularDistancia(coord1, coord2) {
    const R = 6371e3; // Raio da Terra em metros
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    const deltaLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const deltaLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
}

// Função para criar a rota no mapa
function criarRota(origem, destino) {
    const request = {
        origin: origem,
        destination: destino,
        travelMode: 'DRIVING' // ou 'WALKING', dependendo da necessidade
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        } else {
            console.error('Falha ao criar rota:', status);
        }
    });
}

// Função para atualizar a lista e o mapa com os desfibriladores próximos
function atualizarListaEMapa(desfibriladoresProximos) {
    map.setCenter(desfibriladoresProximos.length > 0 ? {
        lat: parseFloat(desfibriladoresProximos[0].latitude),
        lng: parseFloat(desfibriladoresProximos[0].longitude)
    } : { lat: -16.7353, lng: -43.8578 }); // Montes Claros, caso não haja desfibriladores

    atualizarDesfibriladores(map, desfibriladoresProximos);
}

// Função para atualizar a lista de desfibriladores na tabela e adicionar marcadores no mapa
function atualizarDesfibriladores(map, listaDesfibriladores = desfibriladores) {
    const tabela = document.getElementById('desfibriladores-tabela').getElementsByTagName('tbody')[0];
    tabela.innerHTML = ''; // Limpar tabela

    listaDesfibriladores.forEach(desfibrilador => {
        // Adicionar linha na tabela
        const row = tabela.insertRow();
        row.insertCell(0).innerText = desfibrilador.nome;
        row.insertCell(1).innerText = desfibrilador.cidade;
        row.insertCell(2).innerText = desfibrilador.bairro;
        row.insertCell(3).innerText = desfibrilador.rua;
        row.insertCell(4).innerText = desfibrilador.numero;
        row.insertCell(5).innerText = desfibrilador.longitude;
        row.insertCell(6).innerText = desfibrilador.latitude;

        // Adicionar marcador no mapa
        new google.maps.Marker({
            position: { lat: parseFloat(desfibrilador.latitude), lng: parseFloat(desfibrilador.longitude) },
            map: map,
            title: desfibrilador.nome
        });
    });
}

// Chamar a função initMap quando a página carregar
window.onload = function() {
    initMap();
};
