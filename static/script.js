document.addEventListener('DOMContentLoaded', function() {
    let map;
    let markers = new Map(); // Usar Map para almacenar los marcadores con sus IDs

    function initMap() {
        map = L.map('map').setView([8.983333, -79.516667], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Cargar pings existentes
        loadPings();

        // Agregar nuevo ping al hacer clic
        map.on('click', function(e) {
            const info = prompt("Ingrese información para este ping:");
            if (info !== null) {
                addNewPing(e.latlng.lat, e.latlng.lng, info);
            }
        });
    }

    function loadPings() {
        fetch('/get_pings')
            .then(response => response.json())
            .then(data => {
                data.forEach(ping => {
                    addPingToMap(ping._id, ping.lat, ping.lng, ping.info);
                });
            })
            .catch(error => console.error('Error cargando pings:', error));
    }

    function addNewPing(lat, lng, info) {
        fetch('/add_ping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lat, lng, info })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addPingToMap(data.id, lat, lng, info);
                }
            })
            .catch(error => console.error('Error agregando ping:', error));
    }

    function addPingToMap(id, lat, lng, info) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

        const popupContent = `
            <div class="popup-content">
                <h4>Detalles del Ping</h4>
                <textarea id="info-${id}" rows="3">${info || ''}</textarea>
                <button onclick="deletePingFromMap('${id}')">Eliminar Ping</button>
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.set(id, marker);

        // Actualizar al arrastrar
        marker.on('dragend', function(e) {
            const newPos = e.target.getLatLng();
            const currentInfo = document.getElementById(`info-${id}`)?.value || '';
            updatePingInDB(id, newPos.lat, newPos.lng, currentInfo);
        });

        // Actualizar información cuando cambie
        marker.on('popupopen', function() {
            const textarea = document.getElementById(`info-${id}`);
            textarea.addEventListener('change', function() {
                const pos = marker.getLatLng();
                updatePingInDB(id, pos.lat, pos.lng, textarea.value);
            });
        });
    }

    function updatePingInDB(id, lat, lng, info) {
        fetch(`/update_ping/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lat, lng, info })
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error actualizando ping');
                }
            })
            .catch(error => console.error('Error en la actualización:', error));
    }

    function deletePingFromMap(id) {
        fetch(`/delete_ping/${id}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const marker = markers.get(id);
                    if (marker) {
                        map.removeLayer(marker);
                        markers.delete(id);
                    }
                }
            })
            .catch(error => console.error('Error eliminando ping:', error));
    }

    // Hacer la función deletePingFromMap global
    window.deletePingFromMap = deletePingFromMap;

    // Inicializar el mapa
    initMap();
});
