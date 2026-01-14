let telas = JSON.parse(localStorage.getItem("telas")) || [];
let telasFiltradas = telas;

// =====================================
// GUARDAR VARIAS TELAS
// =====================================
function guardarVariasTelas() {
    const input = document.getElementById("fotos");
    if (!input.files.length) {
        alert("Selecciona al menos una imagen");
        return;
    }

    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function() {
            detectarColor(reader.result, color => {
                detectarPatron(reader.result, patron => {
                    const codigo =
                        "TEL-" +
                        color.substring(0,3).toUpperCase() + "-" +
                        patron.substring(0,3).toUpperCase() + "-" +
                        (telas.length + 1);

                    telas.push({
                        codigo,
                        color,
                        patron,
                        imagen: reader.result
                    });

                    localStorage.setItem("telas", JSON.stringify(telas));
                    aplicarFiltros();
                });
            });
        };
        reader.readAsDataURL(file);
    });
}

// =====================================
// DETECCIÓN DE COLOR (IA SIMPLE)
// =====================================
function detectarColor(imagen, callback) {
    const img = new Image();
    img.src = imagen;

    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i+1];
            b += data[i+2];
            count++;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        if (g > r && g > b) callback("verde");
        else if (r > g && r > b) callback("rojo");
        else if (b > r && b > g) callback("azul");
        else if (r > 200 && g > 200) callback("amarillo");
        else if (r > 200 && g > 200 && b > 200) callback("blanco");
        else if (r < 50 && g < 50 && b < 50) callback("negro");
        else callback("otro");
    };
}

// =====================================
// DETECCIÓN DE PATRÓN (IA SIMPLE)
// =====================================
function detectarPatron(imagen, callback) {
    const img = new Image();
    img.src = imagen;

    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let cambios = 0;

        for (let i = 0; i < data.length - 4; i += 16) {
            const diff =
                Math.abs(data[i] - data[i+4]) +
                Math.abs(data[i+1] - data[i+5]) +
                Math.abs(data[i+2] - data[i+6]);
            if (diff > 100) cambios++;
        }

        if (cambios < 500) callback("liso");
        else if (cambios < 2000) callback("rayas");
        else callback("lunares");
    };
}

// =====================================
// FILTRAR CATALOGO
// =====================================
function aplicarFiltros() {
    const color = document.getElementById("filtroColor").value;
    const patron = document.getElementById("filtroPatron").value;

    telasFiltradas = telas.filter(t =>
        (color === "" || t.color === color) &&
        (patron === "" || t.patron === patron)
    );

    mostrarCatalogo();
}

// =====================================
// MOSTRAR CATALOGO
// =====================================
function mostrarCatalogo() {
    const div = document.getElementById("catalogo");
    div.innerHTML = "";

    telasFiltradas.forEach(tela => {
        div.innerHTML += `
            <div class="tela">
                <img src="${tela.imagen}">
                <p><strong>${tela.codigo}</strong></p>
                <p>${tela.color} - ${tela.patron}</p>
            </div>
        `;
    });
}

// =====================================
// EXPORTAR PDF SOLO DEL FILTRO
// =====================================
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 10;
    pdf.setFontSize(16);
    pdf.text("Catálogo de Telas", 10, y);
    y += 10;

    telasFiltradas.forEach(tela => {
        if (y > 250) {
            pdf.addPage();
            y = 10;
        }

        pdf.setFontSize(10);
        pdf.text(`Código: ${tela.codigo}`, 10, y); y += 5;
        pdf.text(`Color: ${tela.color}`, 10, y); y += 5;
        pdf.text(`Patrón: ${tela.patron}`, 10, y); y += 5;

        pdf.addImage(tela.imagen, "JPEG", 10, y, 40, 40);
        y += 50;
    });

    pdf.save("catalogo_filtrado.pdf");
}

// Inicia mostrando todo
aplicarFiltros();
